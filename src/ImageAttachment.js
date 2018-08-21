import axios from "axios";

export default class ImageAttachment {
  constructor(attachment) {
    this.attachment = attachment;
    this.file = attachment.file;
    this.validationMessage = "File not validated";
  }

  isValid({ maxSizeMB } = {}) {
    if (this.attachment.file.type.indexOf("image") !== 0) {
      this.validationMessage = "The file is not a valid image";
      return false;
    }

    if (maxSizeMB && this.attachment.file.size > maxSizeMB * 1048576) {
      this.validationMessage = `The image filesize exceeds the limit of ${maxSizeMB}MB`;
      return false;
    }

    return true;
  }

  uploadTo(url) {
    let fd = new FormData();
    fd.append("image", this.file);

    return new Promise((resolve, reject) => {
      axios
        .post(url, fd)
        .then(({ data }) => {
          this.attachment.setAttributes({ url: data.src });
          resolve();
        })
        .catch(err =>
          reject({
            file: this.file,
            message: err.response
              ? `Upload failed with ${err.response.status} response`
              : err
          })
        );
    });
  }
}
