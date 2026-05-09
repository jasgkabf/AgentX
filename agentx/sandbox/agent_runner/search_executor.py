import urllib.parse
from loguru import logger
from bs4 import BeautifulSoup

from .browser_executor import BrowserExecutor


class SearchExecutor:
    def __init__(self, browser_executor: BrowserExecutor):
        self.browser = browser_executor

    async def search(self, query: str, num_results: int = 10) -> dict:
        try:
            encoded_query = urllib.parse.quote_plus(query)
            url = f"https://www.bing.com/search?q={encoded_query}&count={num_results}"

            nav_result = await self.browser.navigate(url)
            if not nav_result["success"]:
                return {
                    "success": False,
                    "result": None,
                    "error": f"搜索页面导航失败: {nav_result['error']}",
                }

            await self.browser.page.wait_for_selector("#b_results", timeout=10000)

            page_content = await self.browser.page.content()
            soup = BeautifulSoup(page_content, "lxml")

            results = []
            result_items = soup.select("li.b_algo")

            for item in result_items[:num_results]:
                title_elem = item.select_one("h2 a")
                snippet_elem = item.select_one(".b_caption p, .b_lineclamp2")

                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link = title_elem.get("href", "")
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                    results.append({
                        "title": title,
                        "url": link,
                        "snippet": snippet,
                    })

            logger.info(f"搜索完成: '{query}', 结果数: {len(results)}")

            return {
                "success": True,
                "result": {
                    "query": query,
                    "results": results,
                    "count": len(results),
                },
                "error": None,
            }

        except Exception as e:
            logger.error(f"搜索失败: '{query}', 错误: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def search_and_extract(self, query: str, num_results: int = 5) -> dict:
        try:
            search_result = await self.search(query, num_results=num_results)
            if not search_result["success"]:
                return search_result

            results = search_result["result"]["results"]
            detailed_results = []

            for i, item in enumerate(results[:num_results]):
                url = item.get("url", "")
                if not url:
                    continue

                nav_result = await self.browser.navigate(url)
                if not nav_result["success"]:
                    detailed_results.append({
                        **item,
                        "content": None,
                        "extract_error": nav_result["error"],
                    })
                    continue

                extract_result = await self.browser.extract("body")
                content = None
                if extract_result["success"]:
                    content = extract_result["result"]["text"]

                detailed_results.append({
                    **item,
                    "content": content,
                })

                logger.info(f"提取搜索结果 {i+1}/{min(len(results), num_results)}: {url}")

            logger.info(f"搜索并提取完成: '{query}', 提取数: {len(detailed_results)}")

            return {
                "success": True,
                "result": {
                    "query": query,
                    "results": detailed_results,
                    "count": len(detailed_results),
                },
                "error": None,
            }

        except Exception as e:
            logger.error(f"搜索并提取失败: '{query}', 错误: {e}")
            return {"success": False, "result": None, "error": str(e)}
