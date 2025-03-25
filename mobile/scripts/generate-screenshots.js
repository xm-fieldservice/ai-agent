const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 截图配置
const screenshots = [
  {
    name: 'home',
    url: '/',
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2,
    isMobile: true,
    waitForSelector: '.app-container'
  },
  {
    name: 'chat',
    url: '/chat',
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2,
    isMobile: true,
    waitForSelector: '.chat-container'
  },
  {
    name: 'settings',
    url: '/settings',
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2,
    isMobile: true,
    waitForSelector: '.settings-container'
  }
];

// 输出目录
const outputDir = path.join(__dirname, '../public/screenshots');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成截图
async function generateScreenshots() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const screenshot of screenshots) {
      const page = await browser.newPage();
      
      // 设置视口大小
      await page.setViewport({
        width: screenshot.width,
        height: screenshot.height,
        deviceScaleFactor: screenshot.deviceScaleFactor,
        isMobile: screenshot.isMobile
      });

      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');

      // 访问页面
      await page.goto(`http://localhost:3000${screenshot.url}`, {
        waitUntil: 'networkidle0'
      });

      // 等待指定元素加载
      if (screenshot.waitForSelector) {
        await page.waitForSelector(screenshot.waitForSelector);
      }

      // 等待页面加载完成
      await page.waitForTimeout(1000);

      // 生成截图
      await page.screenshot({
        path: path.join(outputDir, `${screenshot.name}.png`),
        fullPage: true
      });

      console.log(`Generated ${screenshot.name}.png`);
      await page.close();
    }

    console.log('All screenshots generated successfully!');
  } catch (error) {
    console.error('Error generating screenshots:', error);
  } finally {
    await browser.close();
  }
}

generateScreenshots(); 