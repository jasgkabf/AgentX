import base64
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from loguru import logger


class BrowserExecutor:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None

    async def initialize(self):
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--lang=zh-CN",
                ],
            )
            context = await self.browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/128.0.0.0 Safari/537.36"
                ),
                locale="zh-CN",
            )
            self.page = await context.new_page()
            logger.info("Playwright 浏览器初始化完成")
        except Exception as e:
            logger.error(f"浏览器初始化失败: {e}")
            raise

    async def navigate(self, url: str) -> dict:
        try:
            response = await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            title = await self.page.title()
            screenshot_b64 = await self._take_screenshot()

            logger.info(f"导航到: {url}, 标题: {title}")

            return {
                "success": True,
                "result": {
                    "title": title,
                    "url": self.page.url,
                    "status": response.status if response else None,
                    "screenshot": screenshot_b64,
                },
                "error": None,
            }
        except Exception as e:
            logger.error(f"导航失败: {url}, 错误: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def click(self, selector: str) -> dict:
        try:
            await self.page.click(selector, timeout=10000)
            await self.page.wait_for_load_state("domcontentloaded", timeout=10000)
            screenshot_b64 = await self._take_screenshot()

            logger.info(f"点击元素: {selector}")

            return {
                "success": True,
                "result": {
                    "screenshot": screenshot_b64,
                    "url": self.page.url,
                },
                "error": None,
            }
        except Exception as e:
            logger.error(f"点击失败: {selector}, 错误: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def type_text(self, selector: str, text: str, submit: bool = False) -> dict:
        try:
            await self.page.fill(selector, "")
            await self.page.type(selector, text, delay=50)

            if submit:
                await self.page.press(selector, "Enter")
                await self.page.wait_for_load_state("domcontentloaded", timeout=10000)

            screenshot_b64 = await self._take_screenshot()

            logger.info(f"输入文字: {selector}, 提交: {submit}")

            return {
                "success": True,
                "result": {
                    "screenshot": screenshot_b64,
                    "url": self.page.url,
                },
                "error": None,
            }
        except Exception as e:
            logger.error(f"输入文字失败: {selector}, 错误: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def screenshot(self) -> dict:
        try:
            screenshot_b64 = await self._take_screenshot()
            return {
                "success": True,
                "result": {"screenshot": screenshot_b64},
                "error": None,
            }
        except Exception as e:
            logger.error(f"截图失败: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def extract(self, selector: str = "body") -> dict:
        try:
            element = await self.page.query_selector(selector)
            if not element:
                return {
                    "success": False,
                    "result": None,
                    "error": f"未找到元素: {selector}",
                }

            html_content = await element.inner_html()
            soup = BeautifulSoup(html_content, "lxml")

            for tag in soup(["script", "style", "noscript", "meta", "link"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)

            logger.info(f"提取内容: {selector}, 文本长度: {len(text)}")

            return {
                "success": True,
                "result": {
                    "text": text,
                    "html_length": len(html_content),
                },
                "error": None,
            }
        except Exception as e:
            logger.error(f"提取内容失败: {selector}, 错误: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def scroll(self, direction: str = "down", amount: int = 300) -> dict:
        try:
            if direction == "down":
                delta = amount
            elif direction == "up":
                delta = -amount
            else:
                return {
                    "success": False,
                    "result": None,
                    "error": f"不支持的滚动方向: {direction}",
                }

            await self.page.mouse.wheel(0, delta)
            await self.page.wait_for_timeout(500)
            screenshot_b64 = await self._take_screenshot()

            logger.info(f"滚动页面: {direction}, {amount}px")

            return {
                "success": True,
                "result": {"screenshot": screenshot_b64},
                "error": None,
            }
        except Exception as e:
            logger.error(f"滚动失败: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def go_back(self) -> dict:
        try:
            await self.page.go_back(wait_until="domcontentloaded", timeout=15000)
            title = await self.page.title()
            screenshot_b64 = await self._take_screenshot()

            logger.info(f"后退到: {self.page.url}")

            return {
                "success": True,
                "result": {
                    "title": title,
                    "url": self.page.url,
                    "screenshot": screenshot_b64,
                },
                "error": None,
            }
        except Exception as e:
            logger.error(f"后退失败: {e}")
            return {"success": False, "result": None, "error": str(e)}

    async def close(self):
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("浏览器已关闭")
        except Exception as e:
            logger.error(f"关闭浏览器失败: {e}")

    async def _take_screenshot(self) -> str:
        screenshot_bytes = await self.page.screenshot(full_page=False)
        return base64.b64encode(screenshot_bytes).decode("utf-8")
