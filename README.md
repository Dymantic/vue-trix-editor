# Vue Trix Rich Text Editor

A Vue wrapper around the Trix rich-text editor, with support for images and auto-save.

[![Build Status](https://travis-ci.org/Dymantic/vue-trix-editor.svg?branch=master)](https://travis-ci.org/Dymantic/vue-trix-editor)

### Note: No true two-one binding.

While you can use v-model to bind the editor contents (the formatted HTML) to your own Vue instance or component,you won't get true two-way binding with this component. That means that if you update the value of your content outside of the editor, it will not be taken into account by the editor. This means you have to treat the editor as the source of truth, not whatever you bind it to. The reason for this is that Trix only reads in the initial content once on initialization, so to force two-way binding, we would have to make Trix re-evaluate and rebuild the entire document on every keystroke, which is not really worth it.

### Installation

```
npm install @dymantic/vue-trix-editor
```

### Usage Example

```js
// simple rich-text editor, the html output is bound to whatever my_html is
// the editor will initailly be populated with the contents from my_html
<trix-vue v-model="my_html"></trix-vue>

// same as above, but will allow adding images
<trix-vue v-model="my_html" image-upload-path="/url/to/upload/images"></trix-vue>

// simple rich-text editor, with a "save" button. Will send editor contents as POST to save-path
<trix-vue v-model="my_html" save-path="/url/to/save/contents"></trix-vue>

// same as above, but will auto-save at given interval (in seconds) if changes have been made
<trix-vue v-model="my_html" save-path="/url/to/save/contents" :save-interval="10"></trix-vue>

// all together now, and allow up to 20MB images
<trix-vue v-model="my_html"
          image-upload-path="/url/to/upload/images"
          max-image-file-size="20"
          save-path="/url/to/save/contents"
          :save-interval="10"
></trix-vue>
```

### Uploading images

If you use the upload images, by supplying the endpoint where your server accepts the image to the `image-upload-path` prop, you need to implement the server side parts yourself. Then ensure that the server reponds with the a body that includes `{src: [URL FOR YOUR STORED IMAGE]}`. If this is not present in the response, the image will not be inserted.

By deafult, a max file size of 5MB is allowed for images, but this may be set via the `max-image-file-size` prop.

#### Adding alt attributes for your images

The regular workflow for adding images does not allow for adding alt attributes for your images. However, if you use the `insert-images-with-dialog` prop (set to true), you may upload your image and include the alt text. The insert image button will now bring up a modal dialog for you to add your image and the alt text, as well as the caption. The disadvantage to this is that the image needs to completely upload before you can insert it into the document, which is not the case with the regular image workflow.

### Props

The following props can be used to define the components behaviour

| Prop name                 | required | default   | Notes                                                                         |
| ------------------------- | -------- | --------- | ----------------------------------------------------------------------------- |
| initial-content           | false    | ""        | The content to populate the editor with initially (or use v-model)            |
| image-upload-path         | false    | ""        | Supplying a value here allows for image uploads                               |
| max-image-file-size       | false    | 5         | Specify the maximum image filesize in MB                                      |
| save-path                 | false    | ""        | Supplying a url will allow content to be saved                                |
| save-as                   | false    | "content" | If using save feature, the name of the form field will be this                |
| save-interval             | false    | null      | Time in seconds to auto-save. Only saves if there are changes since last save |
| placeholder               | false    | ''        | The placeholder to be used for the empty state of the editor                  |
| sticky                    | false    | `false`   | Sticky position the toolbar to remain on the screen while editing.            |
| insert-images-with-dialog | false    | `false`   | If true, you may use a modal dialog to upload images with alt text            |

### Events

The editor will fire the following events:

| Event name          | payload         | Notes                                                                                   |
| ------------------- | --------------- | --------------------------------------------------------------------------------------- |
| image-rejected      | (file, message) | Fired if a user's image cannot be attached, either due to network error or invalid file |
| image-attached      | null            | Fired after an image has been successfully uploaded and inserted into document          |
| content-changed     | null            | Fired whenever editor content changes.                                                  |
| content-saved       | null            | Fired after editor contents have been successfully saved (200-ish response from server) |
| content-save-failed | null            | Fired an error occurs while saving content to provided endpoint                         |

### Extending functionality through scoped slot

_Requires Vue 2.6 or higher_

This component provides a default scoped slot, which will render whatever you put in it in the top toolbar. The intention is to allow for your own buttons, etc to be added that allows you to insert content into the editor. An example would be to add embeds (Youtube, iframes, etc) as attachments.

By adding the `v-slot` directive to the component you may get access to the `document` slot-prop, which is an object with two methods on it you may call. The methods are `attachment` and `html`, which will insert whatever content you provide as either an attachment or as html, respectively.

Note: Html that Trix does not understand how to format will be ignored. You would be better off using an attachment for those situations.

The example below should provide some guidance:

```js
//in your own component or page
<trix-vue v-model="my_html"
          image-upload-path="/url/to/upload/images"
          max-image-file-size="20"
          save-path="/url/to/save/contents"
          :save-interval="10"
          v-slot="{document}"
>
    <embed-youtube-button :trix="document"></embed-youtube-button>
</trix-vue>

//in your embed-youtube-button component
<template>
 // ....
</template>

<script>
    props: ['trix'],

    data() {
        return {
            attachment_content: '', //will probably be the v-model for a textarea
        };
    },

    methods: {
        // an example method that you would call to insert the attachmnet once the attachment_content has been entered
        addAttachment(content) {
            this.trix.attachment(this.attachment_content);
        }
    }
</script>

```

### Pesky console warning for unkown element 'trix-editor'

In development mode, you will get a warning about an unknown element `<trix-editor>`. This is because Trix uses custom elements, and vue assumes they should be vue components. These can't be ignored, because we do need to Vue to render the cusom elements.

While the warning is harmless, it can be suppressed with the following code.

```
//somewhere in your code where you have access to the Vue instance
Vue.config.ignoredElements = [
    'trix-editor',
];
```
