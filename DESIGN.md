Sudoku 领域对象重构与 Svelte 接入设计文档
一、领域对象划分与职责边界
1. Sudoku (Board) 类
核心职责：封装数独棋盘的核心数据与基础操作，是纯粹的数据实体。
持有数据：grid (9x9 二维数组)，存储数独盘面状态。
基础操作：提供 guess(move) 方法，直接修改单元格数值。
状态复制：实现 clone() 方法，生成深拷贝副本，用于历史快照存储。
外表化：实现 toJSON() 和 toString()，支持序列化与调试输出。
2. Game 类
核心职责：封装游戏会话逻辑，作为领域模型，负责状态管理与历史控制。
持有状态：持有当前的 Sudoku 实例 (sudoku) 以及完整的操作历史 (history)。
核心行为：
guess(move): 处理用户输入，生成新棋盘快照，截断无效的 Redo 历史。
undo(): 回退到上一步快照。
redo(): 恢复到下一步快照。
canUndo() / canRedo(): 提供状态判断接口，供 UI 禁用按钮。
序列化：实现 toJSON()，保存当前盘面、历史记录和当前步骤索引。
3. 对比 HW1 的改进
接口严格化：严格遵循作业要求的接口契约（如 createGame 接收 { sudoku } 对象），解决了 Contract 测试报错问题。
历史逻辑重构：使用 currentStep 索引管理历史，逻辑更清晰，确保 Undo/Redo 360° 无死角。
序列化完整化：补充了 fromJSON 静态方法，实现完整的反序列化流程，满足 serialization 测试。
二、Move 定位：值对象 (Value Object)
结论：Move 是值对象，而非实体对象。
无身份标识：Move 仅包含 row, col, value 三个字段，用于传递一次操作指令，不需要唯一 ID 区分。
不可变性：它仅作为数据载体，一旦创建，字段值不再修改。
无生命周期：它由 UI 生成，传递给 Game.guess() 后即完成使命，不涉及持久化或长期管理。
设计意义：将操作指令与领域对象解耦，使 Sudoku/Game 专注于状态逻辑，Move 专注于数据传输。
三、History 存储设计与复制策略
1. History 中存储的内容
存储的是 Sudoku 快照（深拷贝对象数组），而非单纯的 Move 指令序列。
快照设计：this.history = [Sudoku, Sudoku, ...]
数据结构：数组的每一项都是 Sudoku 实例的深拷贝，代表操作后的一个完整盘面状态。
2. 为什么选择存快照？
实现简单、容错高：Undo/Redo 只需切换数组索引，直接恢复对应状态，无需计算反向操作（如 “把 5 改成 0”）。
可靠性：即使中间步骤逻辑有误，恢复快照也能回到确定的历史状态，避免状态污染。
序列化友好：Sudoku 本身支持 toJSON，直接序列化数组即可完成游戏存档。
3. 深拷贝 / 浅拷贝策略
核心原则：所有进入历史记录、对外暴露的 grid，必须深拷贝。
必须深拷贝的场景：
Sudoku.constructor：初始化时深拷贝输入 input，防止外部引用修改内部状态。
Sudoku.clone()：生成历史快照时，确保历史与当前盘面相互独立。
Game.guess()：生成新状态时，基于 this.sudoku.clone()，避免共享引用。
getGrid()：对外返回数据时，返回深拷贝，防止 UI 直接修改内部状态。
浅拷贝风险：若使用浅拷贝，历史记录会与当前盘面共享 grid 引用。修改当前格子时，历史记录也会被同步篡改，导致 Undo/Redo 完全失效。
四、序列化 / 反序列化设计
1. 序列化方案 (toJSON)
Sudoku.toJSON()：仅序列化核心数据 { grid: this.grid }。
不序列化方法，方法属于行为逻辑，无需保存。
Game.toJSON()：序列化 sudoku (当前状态)、history (所有快照)、currentStep (当前索引)。
完整恢复所需的所有状态都被包含，支持 Round-trip 测试。
2. 反序列化方案 (fromJSON)
工厂函数：提供 createSudokuFromJSON(json) 和 createGameFromJSON(json)。
重建逻辑：
读取 JSON 数据中的 grid 或 history 数组。
调用 new Sudoku(grid) 重建棋盘实例。
对于 Game，先重建初始 Sudoku，再批量重建历史数组中的所有 Sudoku 快照，最后设置 currentStep 和 sudoku 状态。
3. 不序列化的字段
所有类的方法（如 guess, undo, clone）。
临时计算属性（如 canUndo 的布尔值，由方法动态计算）。
五、Svelte 接入与响应式设计 (HW1.1 核心)
1. View 层如何消费领域对象？
架构模式：View (Svelte 组件) -> Store Adapter -> Domain (Game/Sudoku)
不再直接操作数组：UI 不再维护本地 grid 状态，所有数据读取和修改都通过 gameStore 进行。
消费主体：gameStore (Svelte Custom Store)。
State 暴露：$gameStore.grid (渲染用)、$gameStore.canUndo / $gameStore.canRedo (控制按钮用)。
Action 暴露：gameStore.guess()、gameStore.undo()、gameStore.redo()。
2. 响应式原理与自动更新
依赖机制：使用 Svelte 的 writable store。
更新链路：
UI 点击单元格 -> 调用 gameStore.guess()。
store 内部调用 domain.game.guess() 修改领域对象状态。
store 调用 sync() 方法，使用 set() 更新内部状态。
Svelte 检测到 $gameStore.grid 变化，自动触发组件重新渲染。
为什么这样有效？：Svelte 的响应式系统追踪 store 的订阅，当 set 方法被调用时，通知所有依赖该 store 的组件更新 DOM。
3. 有利于扩展的部分
解耦：UI 组件仅依赖 store 接口，不关心底层是 Sudoku 还是 Game，未来替换底层逻辑无需修改 UI。
单一职责：store 只负责桥接，domain 只负责逻辑，代码结构清晰。
4. 可能阻碍扩展的部分
存储开销：快照式存储会占用较多内存（虽为 9x9 数组，可接受），若支持无限步数需考虑优化。
Store 耦合：当前 store 直接依赖 domain 导出的类，若未来迁移到 Svelte 5 Runes，可能需要调整 API 调用方式。
