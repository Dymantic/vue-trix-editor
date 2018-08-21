<template>
    <div>
      <div>
        <label v-if="imageUploadPath" for="`image-file-input-${uniqueId}`">
           Insert Image
           <input ref="insertImageInput" type="file" id="`image-file-input-${uniqueId}`" class="hidden-input" @change="insertImage">
        </label>
        <button class="dd_save-content" @click="saveContent" v-show="savePath">Save</button>
      </div>
        <trix-editor @trix-file-accept="guardFiles"
                     @trix-attachment-add="acceptImage"
                     ref="trix"
                     :input="uniqueId"
        ></trix-editor>
        <input type="hidden" :id="uniqueId" name="content">
    </div>
</template>

<script>
//eslint-disable-next-line
import Trix from "trix";
import ImageAttachment from "@/ImageAttachment";
import "trix/dist/trix.css";

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
    saveTimer: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      last_saved_document: null
    };
  },

  mounted() {
    this.$refs.trix.addEventListener("trix-initialize", this.init);
    if (this.saveTimer && this.savePath) {
      window.setInterval(() => {
        if (this.documentChanged()) {
          this.saveContent();
        }
      }, this.saveTimer * 1000);
    }
  },

  methods: {
    init() {
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
      axios
        .post(this.savePath, { content: this.content() })
        .then(() => {
          this.last_saved_document = last_doc;
          this.$emit("content-saved");
        })
        .catch(() => this.$emit("content-save-failed"));
    },

    documentChanged() {
      return !this.currentDocument().isEqualTo(this.last_saved_document);
    },

    currentDocument() {
      return this.$refs.trix.editor.getDocument();
    }
  }
};
</script>

