<template>
    <div>
        <trix-editor input="dd-trix-editor-input"></trix-editor>
        <input type="text" id="dd-trix-editor-input" name="" v-model="content">
    </div>
</template>

<script>
import Trix from "trix";

export default {
  props: {
    content: {
      type: String,
      required: true
    }
  }
};
</script>

