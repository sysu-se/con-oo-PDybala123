<script>
	import ActionBar from './ActionBar/index.svelte';
	import Keyboard from './Keyboard.svelte';

	import { gameStore } from '../../stores/gameStore';
</script>

<div class="px-4 pb-5 flex justify-center">
	<div class="w-full max-w-xl">
		<ActionBar />

		<div class="flex gap-2 mt-2">
			<button on:click={gameStore.undo} disabled={!$gameStore.canUndo}>
				Undo
			</button>
			<button on:click={gameStore.redo} disabled={!$gameStore.canRedo}>
				Redo
			</button>
		</div>

		<Keyboard />
	</div>
</div>
