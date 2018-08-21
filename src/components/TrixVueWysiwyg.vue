<template>
    <div>
      <div>
        <label v-if="imageUploadPath" for="`image-file-input-${uniqueId}`">
           Insert Image
           <input ref="insertImageInput" type="file" id="`image-file-input-${uniqueId}`" class="hidden-input" @change="insertImage">
        </label>
      </div>
        <trix-editor @trix-file-accept="guardFiles"
                     @trix-attachment-add="acceptImage"
                     ref="trix"
                     :input="uniqueId"
        ></trix-editor>
        <input type="text" :id="uniqueId" name="" :value="initialContent">
    </div>
</template>

<script>
//eslint-disable-next-line
import Trix from "trix";
import ImageAttachment from "@/ImageAttachment";
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
    },
    maxImageFileSize: {
      type: Number,
      default: 5
    }
  },

  mounted() {
    this.$refs.trix.addEventListener("trix-initialize", this.init);
  },

  methods: {
    init() {
      this.$refs.trix.addEventListener("trix-change", () => {
        this.$emit("input", this.content);
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

    takeFile(ev) {
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
    }
  }
};
</script>

