import { defineConfig } from '@playwright/test'

/**
 * Test tự động + chụp so sánh giao diện (visual regression).
 *
 *   npm run test:e2e              chạy test, so ảnh với ảnh gốc đã duyệt
 *   npm run test:e2e:update       chụp lại ảnh gốc (sau khi đã XEM và ƯNG giao diện mới)
 *   npm run test:e2e:report       mở báo cáo HTML (ảnh gốc / ảnh mới / chỗ khác nhau)
 *
 * 4 cỡ màn hình theo spec dự án. Ảnh gốc lưu theo hệ điều hành
 * (tests/__screenshots__/win32|linux/...) vì font mỗi máy vẽ hơi khác nhau.
 */
const PORT = 5174

// Máy/CI nào đã có sẵn Chromium riêng thì trỏ vào đây (không bắt buộc)
const executablePath = process.env.PW_CHROMIUM || undefined

const phone = (name: string, width: number, height: number) => ({
  name,
  use: {
    viewport: { width, height },
    deviceScaleFactor: 1, // 1x cho nhanh + ảnh gốc nhẹ; soi chi tiết thì dùng /qa-mobile
    hasTouch: true,
    isMobile: false, // giữ chuột thật để kéo/vuốt ổn định trên mọi máy
  },
})

export default defineConfig({
  testDir: 'tests/e2e',
  snapshotPathTemplate: 'tests/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  outputDir: 'tests/.results',
  timeout: 150_000,
  expect: {
    timeout: 30_000,
    toHaveScreenshot: {
      // 3D (bóng mềm, khử răng cưa) + font mỗi lần vẽ lệch vài điểm ảnh → cho phép chênh nhẹ
      maxDiffPixelRatio: 0.03,
      threshold: 0.25,
      animations: 'allow', // GSAP/three tự chạy; test chờ đúng trạng thái đã "đứng yên" rồi mới chụp
      caret: 'hide',
    },
  },
  fullyParallel: true,
  // cảnh 3D chạy bằng CPU (SwiftShader) rất nặng → ít luồng song song để không bị chậm giả
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'tests/.report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'tests/.report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath,
      // Linux/CI không có GPU → WebGL chạy bằng phần mềm (SwiftShader). Windows/Mac dùng GPU thật.
      args: process.platform === 'linux' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [],
    },
  },
  projects: [
    phone('375x812', 375, 812),
    phone('390x844', 390, 844),
    phone('393x873', 393, 873),
    phone('430x932', 430, 932),
  ],
  webServer: {
    // dev server: có sẵn DỮ LIỆU MẪU trong popup (MOCK_ON) → test chỉ cần up ảnh
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
