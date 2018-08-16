<template>
    <div>
        <trix-editor @trix-file-accept="handleFile" ref="editor" :input="uniqueId"></trix-editor>
        <input type="text" :id="uniqueId" name="" :value="initialContent">
    </div>
</template>

<script>
//eslint-disable-next-line
import Trix from "trix";
// import _ from "trix/dist/trix.css";

export default {
  props: {
    initialContent: {
      type: String,
      default: ""
    },
    uniqueId: {
      type: String,
      default: "dd-trix-input"
    },
    imageUploadPath: {
      type: String
    }
  },

  mounted() {
    this.$refs.editor.addEventListener("trix-initialize", this.init);
  },

  watch: {
    content(n) {
      this.$refs.editor.editor.insertHTML(n);
    }
  },

  methods: {
    init() {
      this.$refs.editor.addEventListener("trix-change", () => {
        this.$emit("input", this.content);
      });
    },

    handleFile(ev) {
      if (!this.imageUploadPath) {
        return ev.preventDefault();
      }
      this.processFile(ev.file);
    },

    processFile(file) {}
  }
};
</script>

