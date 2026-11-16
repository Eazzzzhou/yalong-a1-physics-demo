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

## 9. 第 1 步交付记录（2026-11-16）

第 0 步已由用户验收。第 1 步只完成结构壳，未提前实施完整交互或玻璃外观。

### 实际变更

- 新增 `ui-shell.css`、`ui-shell.js`；`index.html`、`lite.html` 各增加样式、脚本引用与 `ui-shell` 类。
- 画布铺满浏览器窗口；左 360px、右 332px 的侧栏覆盖画面；两栏初始隐藏且 inert，标签“教学”“场景”始终可点。
- 搬移原关卡容器、动作栏、环境控件、品牌、版本链接、全屏和保存画面节点，不复制原按钮，不更换原事件处理函数。
- 底部保留原动作状态，并同步实际关卡反馈；新增的复位快捷按钮直接使用原复位按钮的 onclick 函数及禁用状态。
- 本阶段只有点击展开/收起。窄窗口点击只打开一栏，桌面双栏展开后缩窄也会收起一栏。隐藏内容不进入 Tab 顺序。
- 未修改 demo-app.js、关卡数据、物理运行时、渲染管线、模型或贴图；无新依赖。
- 用户已明确确认：**保留手动全屏，禁止自动全屏**。原按钮及处理函数原样保留；新壳没有调用 Fullscreen API。

### 实际检查

| 检查 | 结果与范围 |
| --- | --- |
| `node --check ui-shell.js` | 通过 |
| 两入口加载 | 完整版 WebGPUBackend、轻量版 WebGLBackend 均加载成功，初始两栏隐藏 |
| 尺寸与页面溢出 | 完整版检查 1280×800、1440×900、1920×1080、768×900、390×844；页面与画布尺寸均等于窗口，没有整页滚动。轻量版检查 1440×900 和 390×844 |
| 侧栏与相机 | 轻量版 1440×900 双栏打开前后画布矩形、相机位置完全相同；侧栏宽 360/332。原动作等七个 onclick 引用保持一致，稳定状态无重复 id |
| 关卡表单 | 两版均打开、填写第 2 关；完整版另查看和填写第 7 关。桌面和手机表格不超出侧栏；第 7 关内容较长时侧栏内部滚动 |
| 返回与版本链接 | 完整版点击返回恢复七张关卡卡片；点击原版本链接完整→轻量→完整，两次均加载到对应后端，并重新从双栏收起开始 |
| 执行与底部状态 | 完整版第 2 关手动填写 +1°、800ms、等待 0，执行完成；侧栏收起后仍显示“验证通过”“执行完成”。轻量版执行也验证了成功与碰撞反馈 |
| 原碰撞对照 | 轻量版第 2 关默认一键填写 8° 时停止于 4.6°。通过浏览器请求拦截只读载入标签中的原 lite.html（其它代码未改），复现完全相同“左夹指碰到相机”结果。没有恢复/覆盖工作区或复制项目 |
| 互锁 | 关卡执行时动作按钮与两个复位入口同步禁用；底部复位和原复位 onclick 是同一个函数 |
| 复位 | 两版都观察到“已复位：机械臂放平，云台倒下”；每次点击对应一个 reset 事件。轻量版碰撞后的复位受原物理碰撞限制，输入仍保留；未扩展复位行为 |
| 动作 | 轻量版实际完成机械臂搬运（出现 friction-grasp、placed 事件）、云台升起、复位、拆解展开和收拢；完整版实际完成云台升起、复位 |
| 相机与环境 | 轻量版拆解切到 wide，再切教学视角；切换深灰摄影棚并把光向改为 120°，读到对应真实状态；完整版重置视角有效 |
| 保存画面 | 轻量版点击原按钮产生“亚龙实验箱.png”下载 |
| 画布/侧栏拖动 | 完整版画布拖动改变相机位置；侧栏区域拖动不改变相机位置 |
| 隐藏内容键盘检查 | 完整版从“教学”标签连续 Tab，焦点经过“场景”、底部复位等，未进入收起的栏内 |
| 手动全屏 | 点击原按钮后测试浏览器返回 `not granted`；未成功进入全屏。未改变原功能以规避权限 |
| 控制台 | 正常加载和教学操作未发现应用错误；全屏测试有上述拒绝信息。自动化在切关动画中曾选中两个“一键填写”，改为定位当前非 ghost 面板后继续，未改变原动效 |
| 等待与性能 | 云台/复位在测试浏览器中有慢于等待上限的情况；继续观察后均完成。未测 FPS，未为追求测试速度改渲染设置或物理步长 |

### 截图复查与质量评价

- [默认收起：完整版 1440×900](docs/frontend-design/phase1-collapsed.png)
- [双栏与第 7 关：完整版 1440×900](docs/frontend-design/phase1-desktop-review.png)
- [教学栏与第 7 关：完整版 390×844](docs/frontend-design/phase1-mobile-review.png)

截图与操作检查发现并修复了：旧 CSS 优先级使画布没有铺满；桌面双栏展开后缩到手机仍重叠；验证完成到运动开始之间底部短暂露出旧“就绪”；切关时底部可能读取退出动画中的旧任务内容。复查后上述问题已消除。

按第 1 步“结构壳”范围自评 **9/10**：画布不被挤压、原控件可达、桌面与手机不溢出、隐藏层不抢键盘、运行状态可见。此分数不是最终玻璃风格、完整无障碍或性能的验收分数。当前保留旧深色实底；手机长任务需要滚动侧栏，右侧打开后会覆盖模型边缘，符合本轮叠加布局约束。

已按 impeccable clarify 检查新增标签、表单标签和底部实际状态，未删除旧文案。按 impeccable audit 进行技术检查：可访问性 3/4、性能实现 4/4（只评价新增代码，无帧率结论）、主题 3/4、响应设计 3/4（已测模拟窗口，未测触摸手势）、实现一致性 4/4，合计 17/20。该技术分数含后续阶段的交互与主题缺项，不等同于本阶段布局自评。完整手机模态与键盘交互属于第 2 步，不宣称已经满足。机械检测运行一次，仅两页各出现一条继承旧 Inter 字体的审美警告；系统字体与最终玻璃令牌按第 3 步处理。

### 阶段边界和未验证项

- 第 2 步未开始：180ms 悬停、400ms 离开、固定/取消固定、Esc、画布点击关闭、触屏遮罩和焦点锁未实现。
- 第 3 步未开始：浅色玻璃、最终字体和材质自评未完成。未用概念图替代页面验证。
- 第 4 步未开始：七关逐项执行、全部动作/环境在两个模式逐项遍历、真实触屏、失败注入、完整尺寸回归及基线 FPS 对比仍未完成。
- 本阶段按具名路径本地提交，未推送。所有应用修改限定在两个入口与两个新壳文件；另外更新本记录并保存三张截图。
