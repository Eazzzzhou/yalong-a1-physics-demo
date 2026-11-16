# 界面改版第 0 步：现状与本地存档

日期：2026-11-16（香港时间）。本步只盘点和存档，未修改应用代码，未开始左右侧栏改版。

## 1. 工作目录与回退点

- 唯一工作目录：`C:\Users\qianchen\Desktop\亚龙虚仿\output\github-pages-20261110-physics-demo`。
- 机器：`DESKTOP-VVA1L3R`；系统报告：`Microsoft Windows 10.0.26320`。
- Git 身份：`Eazzzhou <184349426+Eazzzzhou@users.noreply.github.com>`。
- 远程：`https://github.com/Eazzzzhou/yalong-a1-physics-demo.git`，本步未推送。
- 原提交：`1d9c5d9 Release standalone YL-A1 demo with collision stops and finite-force grasping`。`git log -5` 实际只有这一条；存档前无 stash，无 `pre-ui-shell-20261116` 标签。
- 本步将以下具名文件存入本地提交 `archive: physics-demo baseline before UI shell redesign 2026-11-16`，并创建带说明的本地标签 `pre-ui-shell-20261116`。完成情况以最终回复与 Git 记录为准。
- 原提交仍可追溯早期发布状态，新标签保存本轮开始时已有的深色界面和动效。没有执行 reset、删除、复制目录或远程操作。

## 2. 存档清单

全部逐个指定路径暂存，不使用 `git add .`。本步开始时暂存区为空。

| 类别 | 路径 | 内容与处理 |
| --- | --- | --- |
| 已有未发布工作，已跟踪 | `demo-release.css` | 配色和样式调整，原样存档 |
| 已有未发布工作，已跟踪 | `index.html` | 深色样式引用和资源版本参数，原样存档 |
| 已有未发布工作，已跟踪 | `lite.html` | 同上，原样存档 |
| 已有未发布工作，已跟踪 | `lesson-panel.css` | 关卡布局、控件与状态样式，原样存档 |
| 已有未发布工作，已跟踪 | `lesson-panel.js` | 关卡叠层、焦点、表单和执行状态处理，原样存档 |
| 已有未发布工作，未跟踪 | `demo-dark.css` | 深色主题、入场及响应式样式，原样存档 |
| 已有项目文档，未跟踪 | `PRODUCT.md` | 旧产品设计上下文，原样保留；新方向以 11 月 16 日计划为准 |
| 用户新增计划，未跟踪 | `UI-REDESIGN-PLAN-20261116.md` | 本轮执行依据，原样存档 |
| 已有项目文档，未跟踪 | `docs/frontend-design/前端页面策划案-v1.md` | 旧设计案，原样存档，不当成本轮新要求 |
| 已有项目文档，未跟踪 | `docs/frontend-design/参考与选择.md` | 旧设计参考，原样存档 |
| 本步新增文档 | `ui-shell-inventory.md` | 本盘点 |
| 本步生成证据 | `docs/frontend-design/pre-ui-shell-full-20261116.png` | 完整版基线截图，1440×900 |
| 本步生成证据 | `docs/frontend-design/pre-ui-shell-lite-20261116.png` | 轻量版基线截图，1440×900 |

上述五个已跟踪文件在本步开始前已有差异：合计 367 行新增、187 行删除。不是本轮编写的应用代码。

未提交清单中未发现无关文件、密钥文件或新增模型/贴图等大型二进制文件；没有需要留在暂存区之外的混杂改动。原有 `teaching-bundle.js` 是已跟踪构建产物，本步不重建。截图是本步新增的证据图片。未对整个历史仓库作秘密信息扫描。

## 3. 真实入口、引擎与依赖关系

本目录根部实际有两个 HTML 入口：`index.html`、`lite.html`；没有 `demo.html`。

| 入口 | 模式与资源 | 代码及运行证据 |
| --- | --- | --- |
| `index.html` | `data-render-mode="full"`；完整版模型 `assets/experimental-box.glb`；完整材质与后处理 | `demo-app.js` 创建 `WebGPURenderer`；浏览器实测 `WebGPUBackend` |
| `lite.html` | `data-render-mode="lite"`；`assets/experimental-box-lite.glb`；较低像素比例和阴影尺寸；直接 render，无完整版后处理 | `demo-app.js` 的 `forceWebGL: lightweight`；浏览器实测 `WebGLBackend` |

两页均通过 import map 指向本地 Three.js：`vendor/three/build/three.webgpu.js`，核心文件 `three.core.js` 的 `REVISION` 为 `186`。物理运行时实际由 `demo-app.js` 动态导入 `teaching-bundle.js`，其中包含 Rapier；同目录 `teaching-runtime.js`、`robot-physics.js`、`soft-gripper.js` 是可读源文件，不能把它们误认为页面直接加载的模块。README 标注 Rapier 0.21.0，本步未独立核实该版本号。

样式按以下顺序加载（两入口相同）：

`style.css → preview-layout.css → demo.css → lesson-panel.css → demo-release.css → demo-dark.css`

主要脚本关系：

```text
index.html / lite.html
  demo-start.js → demo-app.js
    render-mode.js（模式与资源选择）
    OrbitControls / GLTFLoader（本地 Three.js）
    studio-stage.js → laboratory-stage.js / photographic-environments.js
    surface-detail.js → servo-labels.js / panel-art.js / finish-calibration.js / button-detail.js
                       → self-occlusion.js（完整版）
    teaching-bundle.js（动态加载：Rapier 与物理/动作运行时）
    explode-preview.js
    lesson-panel.js → levels.js
    lesson-runner.js → angle-map.js / lesson-program.js → levels.js
    lesson-screen.js → finish-calibration.js
    selection-indicator.js / part-labels.js
    studio-post.js（仅完整版：SSGI / SSR / TRAA 等既有后处理）
```

静态品牌、工具栏、画布容器、环境控件位于两入口 HTML；关卡区域由 `lesson-panel.js:initLessonPanel` 写入 `#lesson-panel`；画布由 `demo-app.js:start` 加入 `#viewport`；可访问的伪代码文本由 `lesson-screen.js` 加入同一视口。

启动方法已存在于 README：Python 静态服务器。本次使用 `python -m http.server 8026 --bind 127.0.0.1`，没有安装依赖或建立构建系统。

## 4. 原有控件与处理函数

以下是实际原文，包括编号及空格。所有无独立 id 的控件保留现有 class，不编造 id。

| 可见名称 | id / 选择器 | 原有事件处理路径 |
| --- | --- | --- |
| ① 机械臂搬运 | `#arm-start` | `teaching-bundle.js` 的匿名 onclick → `activate(0)` → `armAction()` |
| ② 云台升起 | `#gimbal-start` | 同上 → `activate(1)` → `gimbalAction()` |
| ③ 复位 | `#reset` | 同上 → `activate(2)` → `reset()` |
| ④ 爆炸拆解 | `#explode-start` | `demo-app.js` 的 onclick → `setView('wide')`、`exploder.toggle()` |
| 演示视角；当前“教学 · 屏幕与机械臂” | `#camera-view` | `demo-app.js` 的 onchange → `setView(value)` |
| 重置视角 | `#reset-view` | `demo-app.js` 的 onclick → `setView('teaching')` |
| 场景与光照 | `#environment` | `demo-app.js` 的 onchange → `setEnvironment(value)` → `stage.apply()`；失败写入 `#action-status` |
| 光线方向 | `#environment-rotation` | `demo-app.js` 的 oninput → `stage.rotate()`，同步 `#environment-angle` |
| Poly Haven | `#environment-source` | 原生外链；`studio-stage.js` 按场景更新链接或隐藏 |
| 保存画面 | `#snapshot` | `demo-app.js` 的 onclick → `post.render()`、canvas.toBlob、下载 PNG |
| 全屏 | `#fullscreen` | `demo-app.js` 的 onclick → `document.documentElement.requestFullscreen()`；仅点击触发 |
| 轻量版 / 完整版 | `.quality-link` | 原生链接分别到 `lite.html` / `index.html`，无自定义处理函数 |
| 七张关卡卡片 | `.lesson-card`（无 id） | `lesson-panel.js` click → `openLevel(level)` |
| 切换关卡 | `.lesson-select`（无 id） | change 的匿名函数 → `openLevel(level)` |
| ← 返回 | `.lesson-back`（无 id） | click 的异步匿名函数 → `runner.prepare()` 后返回列表 |
| 转动量、时间、等待输入 | `.lesson-table input`（无 id，每项有 aria-label） | `addInput()` 绑定 beforeinput / input，更新 `row.values`、`clearResult()`、`updateDeltas()`、`syncControls()` |
| 一键填写 | `.lesson-fill`（无 id） | click → `onFill()` → `runner.suggestedActions()` |
| 验证并执行 | `.lesson-execute`（无 id） | click → `onExecute()` → `runner.execute(rows, onProgress)` |
| 重新加载（加载出错时） | `.render-recovery`（无 id） | `demo-start.js` 动态生成；click → `location.reload()` |

其它已有元素：`#action-status`、`#loading`、`.viewport-label`、`.lesson-feedback`、`.lesson-validation`、`.lesson-status`、`.lesson-busy-note` 是状态显示；`#model`、`#target` 是隐藏的模型/零件选择状态。保留 `YL–A1` 和“实验箱”品牌文字。

相机选项（`index.html`、`lite.html`）：教学 · 屏幕与机械臂、远景 · 整箱、中景 · 功能动作、近景 · 材质细节、材质近景、机械臂、云台、俯视、整箱；分别映射 `teaching/wide/medium/close/detail/arm/gimbal/top/all`。

环境选项：实拍铸造车间 · 金属反射、实拍车间 · 大窗日光、实拍摄影棚 · 柔光箱反射、中性柔光棚、深灰摄影棚 · 轮廓光、暖色摄影棚。灯光界面只有光线方向滑杆（0–360°），没有独立灯强度或颜色编辑器。`studio-stage.js` 应用场景时同步初始光向；当前默认铸造车间截图显示 74°，不能拿 HTML 初始 0° 当实际默认。

两入口没有调试面板、材质工作台或“高级”控件。共享样式里有历史工作台选择器，但不能据此认定界面存在。运行时公开 `window.renderLab` / `window.teaching` 调试对象，不等于已有可搬迁的调试面板。

## 5. 教学内容、验证与互锁

`levels.js` 实际定义七关：设置关节角度、控制底座、控制大臂、控制中间关节、控制腕部、控制夹爪、组合关节姿态。页面具有名称、说明、动作表格、一键填写、验证并执行及运行结果；没有独立任务目标组件、答案评分或关卡解锁界面。

第 1 关填写五个关节转动量，时间/等待固定显示；其它关可编辑角度、时间、等待。`onFill()` 根据当前姿态和标准目标生成相对转动量。切换关卡重建表单，返回先执行准备姿势并清空任务区域；不把这些现有语义改成自动保存答案。

“验证”不是对照标准答案：`lesson-program.js:compileLesson` 检查动作列表、已知关节、有限数值、非负时间与等待，以及夹爪累计开度范围；生成相对转动命令和伪代码。`lesson-runner.js:execute` 先编译，再显示“验证通过”，随后实际运动；物理阶段可能因碰撞/机械限位停止并显示实际转动量。不能概括成完整判题，也不能仅用旧目录“范围校验”的结论替代本目录事实。

原有互锁（同时核对了实际加载的 `teaching-bundle.js` 与可读源码）：

- `lesson-runner.js:acquire()` 检查 `locked` / `teaching.state.busy`，调用 `beginLesson()`；`release()` 调用 `endLesson()`。
- 运行时 `beginLesson()` 设置 `lessonActive` 和 `busy`；`enabled()` 禁用动作按钮，关卡执行期间额外禁用复位。
- `armAction()` / `gimbalAction()` 在 busy 时不启动；`activate()` 在 lessonActive 时拒绝操作，非教学动作忙碌时仅允许复位。
- `lesson-panel.js:syncControls()` 和 `observeBusy()` 同步禁用关卡、输入、填写和执行。
- `explode-preview.js:toggle()` 检查 busy；动作开始前通过 `setBeforeAction()` 收拢爆炸拆解。

复位实际恢复机械臂、云台和三个方块，取消正在播放的演示动作；没有清空教学输入或渲染设置的代码。关卡执行期间复位不可用，这是存档前行为。本步仅作代码核对，未实际执行动作与复位。

## 6. 画布、相机与错误路径

`demo-app.js` 将 `OrbitControls(camera, renderer.domElement)` 直接绑定画布。画布 pointerdown / pointerup 用 5px 位移门槛区分点击和拖动：应用层射线选择零件；运行时另有射线检测箱内绿、黄、红三个实体按钮并调用同一个 `activate()`。侧栏后续不得复制这些绑定。

尺寸与相机变化来源：

- `demo-app.js:resize()` 读取 `#viewport.clientWidth/clientHeight`，调用 `renderer.setSize()`、更新 camera.aspect 和 camera.zoom。
- `new ResizeObserver(resize).observe(host)` 监听视口容器，布局改变会触发；后续侧栏必须覆盖画面，不能挤压这个容器。
- `setView()` 修改相机位置、OrbitControls.target，并调用 resize；初始化、相机选择、重置视角和爆炸拆解入口都会调用它。
- 原全屏按钮通过浏览器全屏改变容器尺寸；当前没有自动请求全屏。

已有错误与模式路径：

- **已有自动降档**：`demo-app.js` 检测 `navigator.gpu` / requestAdapter，不支持则调用 `render-mode.js:openLightweight()`；初始化后若不是 WebGPU 后端也跳转。该函数保留 URL 查询参数与 hash 后执行 location.replace 到 lite.html。本步原样存档，不新增或删除该行为。
- `demo-start.js` 捕获初始化/导入失败，显示原文“实验箱加载失败，请重新加载页面。”及“重新加载”按钮，赋 role=alert，禁用动作、相机和重置视角。这是通用加载失败界面，没有单独的 WebGPU 专用失败对话框。
- 本机两个后端都加载成功，未人为触发缺少 WebGPU 或初始化失败；失败界面与自动跳转只核对了代码。

## 7. 实际验证和截图评价

本步检查目的：确认可安全保存哪些既有文件、真实入口/处理函数在哪里、页面能否作为后续基线加载。若发现混杂文件则排除暂存；若发现加载失败则如实记录为既有问题，不借第 0 步扩大修改范围。

| 检查 | 实际结果 |
| --- | --- |
| git status / log -5 / remote -v / diff --stat / stash / tag | 已读取，文件归属与回退条件如第 1、2 节 |
| 阅读两入口及脚本、当前改动文件 | 已完成，确认 CSS/JS 关系、控件、互锁、校验及错误分支 |
| 本地 index.html 加载 | 成功；renderLab 就绪、加载层隐藏、七关出现；后端 WebGPUBackend；本次页面控制台 0 error |
| 本地 lite.html 加载 | 成功；renderLab 就绪、加载层隐藏、七关出现；后端 WebGLBackend；本次页面控制台 0 error |
| 1440×900 默认相机/铸造车间截图 | 已保存两入口截图，无新截图依赖 |

完整版最初在现有浏览器 929×861 尺寸打开，之后改为 1440×900 拍照；轻量版在 1440×900 打开。没有将偶然初始尺寸当成约定的全尺寸回归。

截图：

- [完整版基线](docs/frontend-design/pre-ui-shell-full-20261116.png)
- [轻量版基线](docs/frontend-design/pre-ui-shell-lite-20261116.png)

对照新计划的基线缺点：左侧常驻关卡区约占三成宽度；顶部工具栏和底部环境控件持续占用画面，底部控件遮住设备；目前为深色实底，尚无浅色玻璃与左右呼出结构；小宽度下关卡区在模型上方，页面需要滚动。这些属于后续已规划改版内容，本步不修。

后续每个界面大阶段都按用户新要求截图，评价布局、可读性、材质、交互和小屏表现，以 9/10 为设计自评目标；存在具体缺点就修复并复查。概念图只用于风格参考，不能替代真实页面验收。本步是存档，不将旧界面宣称为九分改版成果。

## 8. 注意事项与未验证项

- 本步停在第 0 步，按计划第 9、10 节要求等待人工验收，不进入第 1 步；没有调用云端 agent、付费服务或增加依赖。
- 计划写“不得新增自动降档”，但源码已存在自动降档；后续先保留现有渲染路径。若要移除，这是需单独明确的行为变更。
- 计划写“复位一直可用”，而现有互锁禁止关卡执行期间复位；后续不得绕过原处理函数伪造可用按钮或擅改运行时。
- 现有“全屏”按钮会主动请求浏览器全屏，而新壳要求不调用 Fullscreen API。第 1 步需明确保留文字/功能与此约束的处理，不在本步删除或改变按钮。
- 尚未验证七关逐项执行、动作演示、复位是否实际保留输入、互锁竞争、相机拖动、环境切换、保存画面、全屏、失败注入、键盘与全部约定尺寸。
- 未测帧率，不声称性能通过；第 4 步应与本地存档标签在同一设备和场景下比较。没有把旧教学目录的测试作为本目录证据。
- 本步没有改动 -deepseek 副本、教学源码或其它演示目录，没有推送、发布、删除文件。
