# con-oo-PDybala123 - Review

## Review 结论

当前代码有 Game/Sudoku 与 store adapter 的雏形，但领域对象并没有真正接入 Svelte 的真实游戏流程；同时存在构造调用错误、双状态源和数独业务建模缺失等核心问题，整体上不能算完成了本次作业要求中的“以领域对象为核心”的接入。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | poor |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. GameStore 以错误签名创建 Game，初始化链路本身就不成立

- 严重程度：core
- 位置：src/stores/gameStore.js:5-6, src/domain/index.js:87-88, src/domain/index.js:29-31
- 原因：`createGame` 的工厂签名是 `createGame({ sudoku })`，但 `gameStore` 传入的是 `Sudoku` 实例本身。按当前静态调用链，这会让 `Game` 构造函数里的 `sudoku.clone()` 读取到 `undefined`，使领域对象适配层在创建阶段就不可靠。

### 2. 开始新局、加载题目和胜负流程仍然走旧模块，领域对象没有成为真实游戏核心

- 严重程度：core
- 位置：src/stores/gameStore.js:4-39, src/components/Modal/Types/Welcome.svelte:2-24, src/App.svelte:4-18
- 原因：`gameStore` 只在模块加载时创建一个默认实例，没有暴露 `startNew`、`load`、`reset` 等生命周期接口；欢迎弹窗仍调用 `@sudoku/game` 的 `startNew/startCustom`，`App.svelte` 仍订阅旧的 `gameWon`。这意味着真实界面并没有围绕 `Game/Sudoku` 运转，违反了作业最核心的接入要求。

### 3. 用户输入、冲突判断和棋盘渲染来自不同状态源，形成双模型分裂

- 严重程度：core
- 位置：src/components/Controls/Keyboard.svelte:2-25, src/components/Board/index.svelte:4-10, src/components/Board/index.svelte:48-59
- 原因：键盘输入仍直接写 `@sudoku/stores/grid` 的 `userGrid`，棋盘数值却渲染 `$gameStore.grid`，高亮和冲突判断又继续依赖旧 store。这样 Undo/Redo、胜负判断、输入结果并不落在同一个领域模型上，UI 只是把新旧两套状态拼接在一起。

### 4. Sudoku 业务建模过弱，无法代表一局真实数独

- 严重程度：core
- 位置：src/domain/index.js:2-13
- 原因：`Sudoku` 只持有一个可变 `grid`，没有区分题面 givens 与玩家填写值，也没有校验坐标范围、数值范围、固定格不可编辑、行列宫冲突等规则。`guess` 只是裸写二维数组，导致数独业务规则仍滞留在 UI 或旧 store 中，而不是收敛到领域对象内部。

### 5. toJSON 直接暴露内部数组引用，削弱封装和历史安全性

- 严重程度：major
- 位置：src/domain/index.js:19-20
- 原因：`toJSON()` 返回的是 `{ grid: this.grid }`，而不是防御性拷贝。外部代码拿到返回值后仍可绕过领域方法直接修改内部状态，这与当前依赖快照历史的设计目标相冲突。

### 6. Undo/Redo 的 Svelte 接入是旁路式的，现有操作栏按钮并未真正接线

- 严重程度：major
- 位置：src/components/Controls/ActionBar/Actions.svelte:26-35, src/components/Controls/index.svelte:12-19
- 原因：原有 ActionBar 中的 Undo/Redo 按钮没有绑定任何行为，另外又在 `Controls/index.svelte` 新增一组朴素按钮调用 `gameStore`。这说明领域对象并没有自然地融入既有组件结构，而是额外插了一条临时通路。

### 7. 棋盘点击逻辑是未完成的死代码，而且把输入值写死成 5

- 严重程度：minor
- 位置：src/components/Board/index.svelte:33-36
- 原因：`handleCellClick` 既没有绑定到 `Cell`，内部还直接提交固定值 `5`。这暴露出领域对象接入仍停留在试接阶段，没有形成符合数独输入业务的完整交互。

## 优点

### 1. History 在新操作发生时会正确截断 Redo 分支

- 位置：src/domain/index.js:39-45
- 原因：`Game.guess()` 先基于当前状态克隆出新 `Sudoku`，再用 `slice(0, currentStep + 1)` 截断历史后追加新快照，这个撤销/重做的基本语义是清楚且正确的。

### 2. 对外暴露状态时有防御性复制意识

- 位置：src/domain/index.js:15-17, src/domain/index.js:35-37, src/stores/gameStore.js:14-20
- 原因：`Sudoku.clone()`、`Game.getSudoku()` 和 `gameStore.sync()` 都在尽量把 UI 与领域内部状态隔离，避免组件直接持有并篡改内部对象，这个方向符合对象封装和 Svelte 适配层的思路。

### 3. 序列化与反序列化链路比较完整

- 位置：src/domain/index.js:91-105
- 原因：除了 `toJSON()` 外，还补上了 `Sudoku.fromJSON` / `Game.fromJSON`，可以恢复当前盘面、历史和当前步索引，这比只实现单向导出更完整。

### 4. 采用 custom store 作为 Svelte 适配层的方向是对的

- 位置：src/stores/gameStore.js:8-35
- 原因：把领域对象包进 `createGameStore()`，对外暴露响应式状态和命令式接口，本质上就是作业推荐的 Store Adapter 思路；问题主要在于接入没有完成，而不是方向本身错误。

## 补充说明

- 本次结论仅基于静态阅读，未运行应用，也未执行测试；例如 `createGame(sudoku)` 可能导致初始化失败、以及开始新局后领域对象与界面不同步，都是根据当前代码调用链做出的静态判断。
- 评审范围按要求限制在 `src/domain/*`、`src/stores/gameStore.js` 以及其直接相关的 Svelte 接入文件（如 `src/App.svelte`、`src/components/Board/*`、`src/components/Controls/*`、`src/components/Modal/Types/Welcome.svelte`）；未扩展到无关目录。
- 如果作者的真实意图是“题面 grid 仍沿用旧 store，领域对象只管理玩家输入层”，那当前代码也没有把这种职责边界显式建模出来；现状更像是两套模型并存，而不是清晰分层。
