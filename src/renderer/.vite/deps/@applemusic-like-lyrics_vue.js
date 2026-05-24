import {
  BackgroundRender,
  DomLyricPlayer,
  MaskObsceneWordsMode,
  MeshGradientRenderer
} from "./chunk-NURBIJQJ.js";
import {
  Teleport,
  computed,
  createVNode,
  defineComponent,
  mergeProps,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
  watchEffect
} from "./chunk-7XPGAGRY.js";
import "./chunk-PR4QN5HX.js";

// node_modules/@applemusic-like-lyrics/vue/dist/amll-vue.mjs
var BackgroundRender2 = defineComponent({
  name: "BackgroundRender",
  props: {
    album: {
      type: [String, Object],
      required: false
    },
    albumIsVideo: {
      type: Boolean,
      required: false
    },
    fps: {
      type: Number,
      required: false
    },
    playing: {
      type: Boolean,
      required: false
    },
    flowSpeed: {
      type: Number,
      required: false
    },
    hasLyric: {
      type: Boolean,
      required: false
    },
    lowFreqVolume: {
      type: Number,
      required: false
    },
    renderScale: {
      type: Number,
      required: false
    },
    renderer: {
      type: Object,
      required: false
    }
  },
  setup(props, { expose }) {
    const wrapperRef = useTemplateRef("wrapper-ref");
    const bgRenderRef = ref();
    onMounted(() => {
      if (wrapperRef.value) {
        bgRenderRef.value = BackgroundRender.new(props.renderer ?? MeshGradientRenderer);
        const el = bgRenderRef.value.getElement();
        el.style.width = "100%";
        el.style.height = "100%";
        wrapperRef.value.appendChild(el);
      }
    });
    onUnmounted(() => {
      if (bgRenderRef.value) bgRenderRef.value.dispose();
    });
    watchEffect(() => {
      if (props.album) bgRenderRef.value?.setAlbum(props.album, props.albumIsVideo);
    });
    watchEffect(() => {
      if (props.fps) bgRenderRef.value?.setFPS(props.fps);
    });
    watchEffect(() => {
      if (props.playing) bgRenderRef.value?.pause();
      else bgRenderRef.value?.resume();
    });
    watchEffect(() => {
      if (props.flowSpeed) bgRenderRef.value?.setFlowSpeed(props.flowSpeed);
    });
    watchEffect(() => {
      if (props.renderScale) bgRenderRef.value?.setRenderScale(props.renderScale);
    });
    watchEffect(() => {
      if (props.lowFreqVolume) bgRenderRef.value?.setLowFreqVolume(props.lowFreqVolume);
    });
    watchEffect(() => {
      if (props.hasLyric !== void 0) bgRenderRef.value?.setHasLyric(props.hasLyric ?? true);
    });
    expose({
      bgRender: bgRenderRef,
      wrapperEl: wrapperRef
    });
    return () => createVNode("div", {
      "style": "display: contents;",
      "ref": "wrapper-ref"
    }, null);
  }
});
var LyricPlayer = defineComponent({
  name: "LyricPlayer",
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    playing: {
      type: Boolean,
      default: true
    },
    alignAnchor: {
      type: String,
      default: "center"
    },
    alignPosition: {
      type: Number,
      default: 0.5
    },
    enableSpring: {
      type: Boolean,
      default: true
    },
    enableBlur: {
      type: Boolean,
      default: true
    },
    enableScale: {
      type: Boolean,
      default: true
    },
    hidePassedLines: {
      type: Boolean,
      default: false
    },
    maskObsceneWordsMode: {
      type: String,
      default: MaskObsceneWordsMode.Disabled
    },
    optimizeOptions: {
      type: Object,
      required: false
    },
    lyricLines: {
      type: Object,
      required: false
    },
    currentTime: {
      type: Number,
      default: 0
    },
    wordFadeWidth: {
      type: Number,
      default: 0.5
    },
    linePosXSpringParams: {
      type: Object,
      required: false
    },
    linePosYSpringParams: {
      type: Object,
      required: false
    },
    lineScaleSpringParams: {
      type: Object,
      required: false
    },
    lyricPlayer: {
      type: Object,
      required: false
    }
  },
  emits: {
    lineClick: (_) => true,
    lineContextmenu: (_) => true
  },
  slots: Object,
  setup(props, { expose, emit, attrs, slots }) {
    const wrapperRef = useTemplateRef("wrapper-ref");
    const playerRef = ref();
    const lineClickHandler = (e) => emit("lineClick", e);
    const lineContextMenuHandler = (e) => emit("lineContextmenu", e);
    onMounted(() => {
      const wrapper = wrapperRef.value;
      if (wrapper) {
        playerRef.value = new DomLyricPlayer();
        wrapper.appendChild(playerRef.value.getElement());
        playerRef.value.addEventListener("line-click", lineClickHandler);
        playerRef.value.addEventListener("line-contextmenu", lineContextMenuHandler);
      }
    });
    onUnmounted(() => {
      if (playerRef.value) {
        playerRef.value.removeEventListener("line-click", lineClickHandler);
        playerRef.value.removeEventListener("line-contextmenu", lineContextMenuHandler);
        playerRef.value.dispose();
      }
    });
    watchEffect((onCleanup) => {
      if (!props.disabled) {
        let canceled = false;
        let lastTime = -1;
        const onFrame = (time) => {
          if (canceled) return;
          if (lastTime === -1) lastTime = time;
          playerRef.value?.update(time - lastTime);
          lastTime = time;
          requestAnimationFrame(onFrame);
        };
        requestAnimationFrame(onFrame);
        onCleanup(() => {
          canceled = true;
        });
      }
    });
    watchEffect(() => {
      if (props.playing !== void 0) if (props.playing) playerRef.value?.resume();
      else playerRef.value?.pause();
      else playerRef.value?.resume();
    });
    watchEffect(() => {
      if (props.alignAnchor !== void 0) playerRef.value?.setAlignAnchor(props.alignAnchor);
    });
    watchEffect(() => {
      if (props.hidePassedLines !== void 0) playerRef.value?.setHidePassedLines(props.hidePassedLines);
    });
    watchEffect(() => {
      if (props.maskObsceneWordsMode !== void 0) playerRef.value?.setMaskObsceneWords(props.maskObsceneWordsMode);
      else playerRef.value?.setMaskObsceneWords(MaskObsceneWordsMode.Disabled);
    });
    watchEffect(() => {
      if (props.alignPosition !== void 0) playerRef.value?.setAlignPosition(props.alignPosition);
    });
    watchEffect(() => {
      if (props.enableSpring !== void 0) playerRef.value?.setEnableSpring(props.enableSpring);
      else playerRef.value?.setEnableSpring(true);
    });
    watchEffect(() => {
      if (props.enableBlur !== void 0) playerRef.value?.setEnableBlur(props.enableBlur);
      else playerRef.value?.setEnableBlur(true);
    });
    watchEffect(() => {
      if (props.enableScale !== void 0) playerRef.value?.setEnableScale(props.enableScale);
      else playerRef.value?.setEnableScale(true);
    });
    watch([
      playerRef,
      () => props.lyricLines,
      () => props.optimizeOptions
    ], ([player, lyricLines, optimizeOptions]) => {
      if (!player) return;
      if (optimizeOptions !== void 0) player.setOptimizeOptions(optimizeOptions);
      if (lyricLines !== void 0) player.setLyricLines(lyricLines);
      else player.setLyricLines([]);
      if (props.currentTime !== void 0) player.setCurrentTime(props.currentTime, true);
    }, { immediate: true });
    watchEffect(() => {
      if (props.currentTime !== void 0) playerRef.value?.setCurrentTime(props.currentTime);
    });
    watchEffect(() => {
      if (props.wordFadeWidth !== void 0) playerRef.value?.setWordFadeWidth(props.wordFadeWidth);
    });
    watchEffect(() => {
      if (props.linePosXSpringParams !== void 0) playerRef.value?.setLinePosXSpringParams(props.linePosXSpringParams);
    });
    watchEffect(() => {
      if (props.linePosYSpringParams !== void 0) playerRef.value?.setLinePosYSpringParams(props.linePosYSpringParams);
    });
    watchEffect(() => {
      if (props.lineScaleSpringParams !== void 0) playerRef.value?.setLineScaleSpringParams(props.lineScaleSpringParams);
    });
    const bottomLineEl = computed(() => playerRef.value?.getBottomLineElement());
    expose({
      lyricPlayer: playerRef,
      wrapperEl: wrapperRef
    });
    return () => createVNode("div", mergeProps({ "ref": "wrapper-ref" }, attrs), [bottomLineEl.value && createVNode(Teleport, { "to": bottomLineEl.value }, { default: () => [slots["bottom-line"]?.()] })]);
  }
});
export {
  BackgroundRender2 as BackgroundRender,
  LyricPlayer
};
//# sourceMappingURL=@applemusic-like-lyrics_vue.js.map
