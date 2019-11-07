<template>
  <div class="dd-vue-trix" :class="{'stick': sticky}">
    <div class="dd-trix-toolbar">
      <label
        v-if="imageUploadPath"
        :for="`image-file-input-${uniqueId}`"
        class="dd-insert-image-label"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="#333"
            d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2zm16 8.59V6H4v6.59l4.3-4.3a1 1 0 0 1 1.4 0l5.3 5.3 2.3-2.3a1 1 0 0 1 1.4 0l1.3 1.3zm0 2.82l-2-2-2.3 2.3a1 1 0 0 1-1.4 0L9 10.4l-5 5V18h16v-2.59zM15 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
          />
        </svg>
        <span>Insert Image</span>
        <input
          ref="insertImageInput"
          type="file"
          :id="`image-file-input-${uniqueId}`"
          class="hidden-input"
          @change="insertImage"
        />
      </label>
      <div class="plugin-button-bar">
        <slot v-bind:document="document"></slot>
      </div>
      <div class="dd-save-content">
        <span v-show="last_saved_time">Last saved: {{ last_saved_at }}</span>
        <button class="dd_save-content" @click="saveContent" v-show="savePath">
          <span>Save</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="16px" fill="#bbb">
            <path
              d="M0 2C0 .9.9 0 2 0h14l4 4v14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5 0v6h10V2H5zm6 1h3v4h-3V3z"
            />
          </svg>
        </button>
      </div>
    </div>
    <trix-editor
      @trix-file-accept="guardFiles"
      @trix-attachment-add="acceptImage"
      @trix-change="$emit('content-changed')"
      ref="trix"
      :input="uniqueId"
      :placeholder="placeholder"
    ></trix-editor>
    <input type="hidden" :id="uniqueId" name="content" />
  </div>
</template>

<script>
//eslint-disable-next-line
import Trix from "trix";
import ImageAttachment from "@/ImageAttachment";

import axios from "axios";

export default {
  model: {
    prop: "initial-content",
    event: "input"
  },

  props: {
    initialContent: {
      type: String,
      default: ""
    },
    uniqueId: {
      type: String,
      default: "dd-trix-input"
    },
    placeholder: {
      type: String,
      required: false,
      default() {
        return "";
      }
    },
    imageUploadPath: {
      type: String
    },
    maxImageFileSize: {
      type: Number,
      default: 5
    },
    savePath: {
      type: String,
      default: ""
    },
    saveAs: {
      type: String,
      default: "content"
    },
    saveInterval: {
      type: Number,
      default: 0
    },
    sticky: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      last_saved_document: null,
      last_saved_time: null,
      editor: null
    };
  },

  computed: {
    last_saved_at() {
      if (!(this.last_saved_time instanceof Date)) {
        return "";
      }

      return this.last_saved_time.toLocaleTimeString();
    },

    document() {
      return {
        attachment: content => this.insertAttactment(content),

        html: content => this.insertHtml(content)
      };
    }
  },

  mounted() {
    this.$refs.trix.addEventListener("trix-initialize", this.init);
    Trix.config.attachments.preview.caption = { name: false, size: false };
    if (this.saveInterval && this.savePath) {
      window.setInterval(() => {
        if (this.documentChanged()) {
          this.saveContent();
        }
      }, this.saveInterval * 1000);
    }
  },

  methods: {
    init() {
      this.editor = this.$refs.trix.editor;
      this.$refs.trix.editor.insertHTML(this.initialContent);
      this.last_saved_document = this.currentDocument();
      this.$refs.trix.addEventListener("trix-change", () => {
        this.$emit("input", this.content());
      });
    },

    insertImage() {
      this.$refs.trix.editor.insertFile(this.takeFile());
    },

    acceptImage(ev) {
      if (ev.hasOwnProperty("attachment") && ev.attachment.file) {
        return this.processFile(new ImageAttachment(ev.attachment));
      }
    },

    takeFile() {
      return this.$refs.insertImageInput.files[0];
    },

    guardFiles(ev) {
      if (!this.imageUploadPath) {
        return ev.preventDefault();
      }
    },

    processFile(attachment) {
      if (!attachment.isValid({ maxSizeMB: this.maxImageFileSize })) {
        return this.rejectFile(attachment.file, attachment.validationMessage);
      }
      attachment
        .uploadTo(this.imageUploadPath)
        .then(this.$emit("image-attached"))
        .catch(err => this.rejectFile(err.file, err.message));
    },

    rejectFile(file, message) {
      this.$emit("image-rejected", { file, message });
    },

    content() {
      return document.querySelector(`#${this.uniqueId}`).value;
    },

    saveContent() {
      const last_doc = this.currentDocument();
      const content = {};
      content[this.saveAs] = this.content();
      axios
        .post(this.savePath, content)
        .then(() => {
          this.last_saved_document = last_doc;
          this.last_saved_time = new Date();
          this.$emit("content-saved");
        })
        .catch(() => this.$emit("content-save-failed"));
    },

    documentChanged() {
      return !this.currentDocument().isEqualTo(this.last_saved_document);
    },

    currentDocument() {
      return this.$refs.trix.editor.getDocument();
    },

    insertAttactment(content) {
      const attachment = new Trix.Attachment({ content });
      this.editor.insertAttachment(attachment);
    },

    insertHtml(content) {
      this.editor.insertHTML(content);
    }
  }
};
</script>

<style>
.dd-trix-toolbar {
  display: flex;
  justify-content: space-between;
  margin: 0.25rem 0;
  height: 36px;
  padding: 0.25rem 0;
}

.plugin-button-bar {
  display: flex;
  align-items: center;
}

.plugin-button-bar > * {
  margin: 0 0.5rem;
}

.dd-trix-toolbar .dd-save-content {
  display: flex;
  align-items: center;
}

.dd-trix-toolbar .dd-save-content button {
  border: 1px solid #bbb;
  margin-left: 0.5rem;
  padding: 4px;
  display: flex;
  align-items: center;
}

.dd-trix-toolbar .dd-save-content button svg {
  margin-left: 8px;
}

.dd-trix-toolbar .dd-insert-image-label {
  display: flex;
  align-items: center;
  margin-right: 1rem;
  border: 1px solid #bbb;
  padding: 4px;
}

.dd-trix-toolbar .dd-insert-image-label svg {
  margin-right: 5px;
}

.dd-trix-toolbar .dd-insert-image-label input {
  display: none;
}
trix-editor {
  border: 1px solid #bbb;
  border-radius: 3px;
  margin: 0;
  padding: 0.4em 0.6em;
  min-height: 5em;
  outline: none;
}

.dd-vue-trix.stick .attachment {
  z-index: -1;
}

.dd-vue-trix.stick .dd-trix-toolbar {
  background: #fff;
  position: sticky;
  top: 0;
}

.dd-vue-trix.stick trix-toolbar {
  background: #fff;
  position: sticky;
  top: 36px;
}
trix-toolbar * {
  box-sizing: border-box;
}
trix-toolbar .trix-button-row {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
}
trix-toolbar .trix-button-group {
  display: flex;
  margin-bottom: 10px;
  border: 1px solid #bbb;
  border-top-color: #ccc;
  border-bottom-color: #888;
  border-radius: 3px;
}
trix-toolbar .trix-button {
  position: relative;
  float: left;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.75em;
  font-weight: 600;
  white-space: nowrap;
  padding: 0 0.5em;
  margin: 0;
  outline: none;
  border: none;
  border-bottom: 1px solid #ddd;
  border-radius: 0;
  background: transparent;
}
trix-toolbar .trix-button:not(:first-child) {
  border-left: 1px solid #ccc;
}
trix-toolbar .trix-button.trix-active {
  background: #cbeefa;
  color: black;
}
trix-toolbar .trix-button:not(:disabled) {
  cursor: pointer;
}
trix-toolbar .trix-button:disabled {
  color: rgba(0, 0, 0, 0.125);
}
@media (max-device-width: 768px) {
  trix-toolbar .trix-button {
    letter-spacing: -0.01em;
    padding: 0 0.3em;
  }
}
trix-toolbar .trix-button--icon {
  font-size: inherit;
  width: 2.6em;
  height: 1.6em;
  max-width: calc(0.8em + 4vw);
  text-indent: -9999px;
}
@media (max-device-width: 768px) {
  trix-toolbar .trix-button--icon {
    height: 2em;
    max-width: calc(0.8em + 3.5vw);
  }
}
trix-toolbar .trix-button--icon::before {
  display: inline-block;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.6;
  content: "";
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}
@media (max-device-width: 768px) {
  trix-toolbar .trix-button--icon::before {
    right: 6%;
    left: 6%;
  }
}
trix-toolbar .trix-button--icon.trix-active::before {
  opacity: 1;
}
trix-toolbar .trix-button--icon:disabled::before {
  opacity: 0.125;
}
trix-toolbar .trix-button--icon-bold::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M15.6%2011.8c1-.7%201.6-1.8%201.6-2.8a4%204%200%200%200-4-4H7v14h7c2.1%200%203.7-1.7%203.7-3.8%200-1.5-.8-2.8-2.1-3.4zM10%207.5h3a1.5%201.5%200%201%201%200%203h-3v-3zm3.5%209H10v-3h3.5a1.5%201.5%200%201%201%200%203z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-italic::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M10%205v3h2.2l-3.4%208H6v3h8v-3h-2.2l3.4-8H18V5h-8z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-link::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M9.88%2013.7a4.3%204.3%200%200%201%200-6.07l3.37-3.37a4.26%204.26%200%200%201%206.07%200%204.3%204.3%200%200%201%200%206.06l-1.96%201.72a.91.91%200%201%201-1.3-1.3l1.97-1.71a2.46%202.46%200%200%200-3.48-3.48l-3.38%203.37a2.46%202.46%200%200%200%200%203.48.91.91%200%201%201-1.3%201.3z%22%2F%3E%3Cpath%20d%3D%22M4.25%2019.46a4.3%204.3%200%200%201%200-6.07l1.93-1.9a.91.91%200%201%201%201.3%201.3l-1.93%201.9a2.46%202.46%200%200%200%203.48%203.48l3.37-3.38c.96-.96.96-2.52%200-3.48a.91.91%200%201%201%201.3-1.3%204.3%204.3%200%200%201%200%206.07l-3.38%203.38a4.26%204.26%200%200%201-6.07%200z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-strike::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M12.73%2014l.28.14c.26.15.45.3.57.44.12.14.18.3.18.5%200%20.3-.15.56-.44.75-.3.2-.76.3-1.39.3A13.52%2013.52%200%200%201%207%2014.95v3.37a10.64%2010.64%200%200%200%204.84.88c1.26%200%202.35-.19%203.28-.56.93-.37%201.64-.9%202.14-1.57s.74-1.45.74-2.32c0-.26-.02-.51-.06-.75h-5.21zm-5.5-4c-.08-.34-.12-.7-.12-1.1%200-1.29.52-2.3%201.58-3.02%201.05-.72%202.5-1.08%204.34-1.08%201.62%200%203.28.34%204.97%201l-1.3%202.93c-1.47-.6-2.73-.9-3.8-.9-.55%200-.96.08-1.2.26-.26.17-.38.38-.38.64%200%20.27.16.52.48.74.17.12.53.3%201.05.53H7.23zM3%2013h18v-2H3v2z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-quote::before {
  background-image: url(data:image/svg+xml,%3Csvg%20version%3D%221%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M6%2017h3l2-4V7H5v6h3zm8%200h3l2-4V7h-6v6h3z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-heading-1::before {
  background-image: url(data:image/svg+xml,%3Csvg%20version%3D%221%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M12%209v3H9v7H6v-7H3V9h9zM8%204h14v3h-6v12h-3V7H8V4z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-code::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M18.2%2012L15%2015.2l1.4%201.4L21%2012l-4.6-4.6L15%208.8l3.2%203.2zM5.8%2012L9%208.8%207.6%207.4%203%2012l4.6%204.6L9%2015.2%205.8%2012z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-bullet-list::before {
  background-image: url(data:image/svg+xml,%3Csvg%20version%3D%221%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M4%204a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm0%206a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm0%206a2%202%200%201%200%200%204%202%202%200%200%200%200-4zm4%203h14v-2H8v2zm0-6h14v-2H8v2zm0-8v2h14V5H8z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-number-list::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M2%2017h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1%203h1.8L2%2013.1v.9h3v-1H3.2L5%2010.9V10H2v1zm5-6v2h14V5H7zm0%2014h14v-2H7v2zm0-6h14v-2H7v2z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-undo::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M12.5%208c-2.6%200-5%201-6.9%202.6L2%207v9h9l-3.6-3.6A8%208%200%200%201%2020%2016l2.4-.8a10.5%2010.5%200%200%200-10-7.2z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-redo::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M18.4%2010.6a10.5%2010.5%200%200%200-16.9%204.6L4%2016a8%208%200%200%201%2012.7-3.6L13%2016h9V7l-3.6%203.6z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-decrease-nesting-level::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M3%2019h19v-2H3v2zm7-6h12v-2H10v2zm-8.3-.3l2.8%202.9L6%2014.2%204%2012l2-2-1.4-1.5L1%2012l.7.7zM3%205v2h19V5H3z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-button--icon-increase-nesting-level::before {
  background-image: url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Cpath%20d%3D%22M3%2019h19v-2H3v2zm7-6h12v-2H10v2zm-6.9-1L1%2014.2l1.4%201.4L6%2012l-.7-.7-2.8-2.8L1%209.9%203.1%2012zM3%205v2h19V5H3z%22%2F%3E%3C%2Fsvg%3E);
}
trix-toolbar .trix-dialogs {
  position: relative;
}
trix-toolbar .trix-dialog {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-size: 0.75em;
  padding: 15px 10px;
  background: #fff;
  box-shadow: 0 0.3em 1em #ccc;
  border-top: 2px solid #888;
  border-radius: 5px;
  z-index: 5;
}
trix-toolbar .trix-input--dialog {
  font-size: inherit;
  font-weight: normal;
  padding: 0.5em 0.8em;
  margin: 0 10px 0 0;
  border-radius: 3px;
  border: 1px solid #bbb;
  background-color: #fff;
  box-shadow: none;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
trix-toolbar .trix-input--dialog.validate:invalid {
  box-shadow: #f00 0px 0px 1.5px 1px;
}
trix-toolbar .trix-button--dialog {
  font-size: inherit;
  padding: 0.5em;
  border-bottom: none;
}
trix-toolbar .trix-dialog--link {
  max-width: 600px;
}
trix-toolbar .trix-dialog__link-fields {
  display: flex;
  align-items: baseline;
}
trix-toolbar .trix-dialog__link-fields .trix-input {
  flex: 1;
}
trix-toolbar .trix-dialog__link-fields .trix-button-group {
  flex: 0 0 content;
  margin: 0;
}
trix-editor [data-trix-mutable="true"] {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
trix-editor [data-trix-mutable="true"] img {
  box-shadow: 0 0 0 2px highlight;
}
trix-editor [data-trix-mutable="true"].attachment.attachment--file {
  box-shadow: 0 0 0 2px highlight;
  border-color: transparent;
}
trix-editor [data-trix-mutable="true"]::-moz-selection,
trix-editor [data-trix-cursor-target]::-moz-selection {
  background: none;
}
trix-editor [data-trix-mutable="true"]::selection,
trix-editor [data-trix-cursor-target]::selection {
  background: none;
}
trix-editor .attachment {
  position: relative;
}
trix-editor .attachment:hover {
  cursor: default;
}
trix-editor .attachment--preview .attachment__caption:hover {
  cursor: text;
}
trix-editor .attachment__progress {
  position: absolute;
  z-index: 1;
  height: 20px;
  top: calc(50% - 10px);
  left: 5%;
  width: 90%;
  opacity: 0.9;
  transition: opacity 200ms ease-in;
}
trix-editor .attachment__progress[value="100"] {
  opacity: 0;
}
trix-editor .attachment__caption-editor {
  display: inline-block;
  width: 100%;
  margin: 0;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
  line-height: inherit;
  color: inherit;
  text-align: center;
  vertical-align: top;
  border: none;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
trix-editor .attachment__remove {
  cursor: pointer;
}
trix-editor .attachment__remove--icon {
  text-indent: -9999px;
  display: block;
  position: absolute;
  z-index: 1;
  padding: 0;
  margin: 0;
  top: -1.1em;
  left: calc(50% - 0.8em);
  width: 1.8em;
  height: 1.8em;
  line-height: 1.8em;
  border-radius: 50%;
  background-color: #fff;
  border: 2px solid highlight;
  box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.25);
}
trix-editor .attachment__remove--icon::before {
  display: inline-block;
  position: absolute;
  top: 0.1em;
  right: 0.1em;
  bottom: 0.1em;
  left: 0.1em;
  opacity: 0.75;
  content: "";
  background-image: url(data:image/svg+xml,%3Csvg%20height%3D%2224%22%20width%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M19%206.4L17.6%205%2012%2010.6%206.4%205%205%206.4l5.6%205.6L5%2017.6%206.4%2019l5.6-5.6%205.6%205.6%201.4-1.4-5.6-5.6z%22%2F%3E%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E);
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}
trix-editor .attachment__remove--icon:hover {
  border-color: #333;
}
trix-editor .attachment__remove--icon:hover::before {
  opacity: 1;
}
.trix-content {
  line-height: 1.5;
}
.trix-content * {
  box-sizing: border-box;
}
.trix-content h1 {
  font-size: 1.2em;
  line-height: 1.2;
  margin: 0;
}
.trix-content blockquote {
  margin: 0 0 0 0.3em;
  padding: 0 0 0 0.6em;
  border-left: 0.3em solid #ccc;
}
.trix-content pre {
  display: inline-block;
  width: 100%;
  vertical-align: top;
  font-family: monospace;
  font-size: 0.9em;
  margin: 0;
  padding: 0.5em;
  white-space: pre;
  background-color: #eee;
  overflow-x: auto;
}
.trix-content ul,
.trix-content ol,
.trix-content li {
  margin: 0;
  padding: 0;
}
.trix-content ul li,
.trix-content ol li,
.trix-content li li {
  margin-left: 1em;
}
.trix-content img {
  max-width: 100%;
  height: auto;
}
.trix-content a[data-trix-attachment] {
  color: inherit;
  text-decoration: none;
}
.trix-content a[data-trix-attachment]:hover,
.trix-content a[data-trix-attachment]:visited:hover {
  color: inherit;
}
.trix-content .attachment {
  display: inline-block;
  position: relative;
  max-width: 100%;
  margin: 0;
  padding: 0;
}
.trix-content .attachment__caption {
  padding: 0;
  text-align: center;
}
.trix-content
  .attachment__caption
  .attachment__name
  + .attachment__size::before {
  content: " · ";
}
.trix-content .attachment--preview {
  width: 100%;
  text-align: center;
}
.trix-content .attachment--preview .attachment__caption {
  color: #666;
  font-size: 0.9em;
  line-height: 1.2;
}
.trix-content .attachment--file {
  color: #333;
  line-height: 1;
  margin: 0 2px 2px 0;
  padding: 0.4em 1em;
  border: 1px solid #bbb;
  border-radius: 5px;
}
</style>
