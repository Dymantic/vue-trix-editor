import ImageAttachment from "@/ImageAttachment";
import moxios from "moxios";
import sinon from "sinon";

describe("an inserted image file", () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("can be constructed with a given attachment", () => {
    const attachment = {
      file: {
        size: 5000,
        type: "image/png"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img instanceof ImageAttachment).toBe(true);
    expect(img.attachment).toEqual(attachment);
  });

  it("has direct access to the file instance", () => {
    const attachment = {
      file: {
        size: 5000,
        type: "image/png"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img.file).toEqual({
      size: 5000,
      type: "image/png"
    });
  });

  it("is valid if the type is an image and no contraints are given", () => {
    const attachment = {
      file: {
        size: 5000,
        type: "image/png"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img.isValid()).toBe(true);
  });

  it("is valid if the type is image and size is within constraint", () => {
    const attachment = {
      file: {
        size: 5000000,
        type: "image/png"
      }
    };

    const img = new ImageAttachment(attachment);
    expect(img.isValid({ maxSizeMB: 8 })).toBe(true);
  });

  it("is not valid if file is not an image", () => {
    const attachment = {
      file: {
        size: 5000,
        type: "text/html"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img.isValid()).toEqual(false);
  });

  it("is not valid if file is larger than given constraint", () => {
    const attachment = {
      file: {
        size: 80000000,
        type: "image/png"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img.isValid({ maxSizeMB: 5 })).toEqual(false);
  });

  it("has correct validation message for a file that is too big", () => {
    const attachment = {
      file: {
        size: 9000000,
        type: "image/png"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img.isValid({ maxSizeMB: 5 })).toEqual(false);
    expect(img.validationMessage).toBe(
      "The image filesize exceeds the limit of 5MB"
    );
  });

  it("has the correct validation message if file is not an image", () => {
    const attachment = {
      file: {
        size: 5000,
        type: "text/html"
      }
    };
    const img = new ImageAttachment(attachment);
    expect(img.isValid({ maxSizeMB: 5 })).toEqual(false);
    expect(img.validationMessage).toBe("The file is not a valid image");
  });

  it("can be uploaded to a given url", done => {
    const attachment = {
      file: {
        size: 5000,
        type: "text/html"
      }
    };
    const img = new ImageAttachment(attachment);

    moxios.wait(() => {
      let request = moxios.requests.mostRecent();
      expect(request.config.data instanceof FormData).toBe(true);
      expect(request.config.data.has("image")).toBe(true);
      expect(request.url).toBe("/test-url");
      done();
    });

    const response = img.uploadTo("/test-url");

    expect(response instanceof Promise).toBe(true);
  });

  it("uploadTo resolves with the no data from server on succesfull upload", done => {
    const attachment = {
      file: {
        size: 5000,
        type: "text/html"
      },
      setAttributes: () => {}
    };
    const img = new ImageAttachment(attachment);
    moxios.stubRequest("/test-url", {
      status: 200,
      response: { src: "testpic.png" }
    });

    const resp = img.uploadTo("/test-url").then(res => {
      expect(res).not.toBeDefined();
      done();
    });
  });

  it("uploadTo rejects with the file and a mesage if upload fails", done => {
    const attachment = {
      file: {
        size: 5000,
        type: "text/html"
      }
    };
    const img = new ImageAttachment(attachment);
    moxios.stubRequest("/test-url", {
      status: 404
    });

    img.uploadTo("/test-url").catch(err => {
      expect(err.file).toEqual(attachment.file);
      expect(err.message).toBe("Upload failed with 404 response");
      done();
    });
  });

  it("sets the url attribute of the attachment after successful upload", done => {
    const attachment = {
      file: {
        size: 5000,
        type: "text/html"
      },
      setAttributes: sinon.fake()
    };
    const img = new ImageAttachment(attachment);
    moxios.stubRequest("/test-url", {
      status: 200,
      response: { src: "testpic.png" }
    });

    const resp = img.uploadTo("/test-url").then(res => {
      expect(
        img.attachment.setAttributes.calledWith({ url: "testpic.png" })
      ).toBe(true);
      done();
    });
  });
});
