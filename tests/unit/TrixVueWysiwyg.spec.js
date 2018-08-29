import { shallowMount } from "@vue/test-utils";
import TrixVueWysiwyg from "@/components/TrixVueWysiwyg.vue";
import sinon from "sinon";
import ImageAttachment from "@/ImageAttachment";
import moxios from "moxios";

function wait(seconds) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => resolve(), seconds * 1000);
  });
}

function getWrapper(properties = {}) {
  const def = {
    attachToDocument: true
  };

  const wrapper = shallowMount(
    TrixVueWysiwyg,
    Object.assign(def, { propsData: properties })
  );
  wrapper.setMethods({ currentDocument: () => false });
  return wrapper;
}

describe("the TrixVue component", () => {
  it("has a default value for the unique id and input name for the trix editor", () => {
    const wrapper = getWrapper();
    const editor_input = wrapper.find("#dd-trix-input");
    const editor = wrapper.find("trix-editor");

    expect(editor_input.element).toBeDefined();
    expect(editor_input.element.tagName).toBe("INPUT");

    expect(editor.element.getAttribute("input")).toBe("dd-trix-input");
  });

  it("can take the unique id and input name for the trix editor as a prop", () => {
    const wrapper = getWrapper({ uniqueId: "unique-test-id" });
    const editor_input = wrapper.find("#unique-test-id");
    const editor = wrapper.find("trix-editor");

    expect(editor.element).toBeDefined();
    expect(editor.element.getAttribute("input")).toBe("unique-test-id");
  });

  it("prevents file attachments if no image path prop is given", () => {
    const wrapper = getWrapper();
    const ev = {
      preventDefault: sinon.fake()
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-file-accept", ev);

    expect(ev.preventDefault.calledOnce).toBe(true);
  });

  it("it can process an attached file if there is an image upload path", () => {
    const wrapper = getWrapper({ imageUploadPath: "/test-upload" });
    wrapper.setMethods({ processFile: sinon.stub() });
    const ev = {
      preventDefault: sinon.fake(),
      attachment: {
        file: {
          type: "image/png"
        }
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-attachment-add", ev);

    expect(ev.preventDefault.calledOnce).toBe(false);
    expect(
      wrapper.vm.processFile.calledWith(
        new ImageAttachment({ file: { type: "image/png" } })
      )
    ).toBe(true);
  });

  it("rejects file attachments if they are not images", () => {
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload"
    });
    wrapper.setMethods({ rejectFile: sinon.stub() });
    const ev = {
      preventDefault: sinon.fake(),
      attachment: {
        file: {
          type: "text/html"
        }
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-attachment-add", ev);

    expect(wrapper.vm.rejectFile.calledOnce).toBe(true);
  });

  it("rejects images over 5mb by default", () => {
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload"
    });
    wrapper.setMethods({ rejectFile: sinon.stub() });
    const ev = {
      preventDefault: sinon.fake(),
      attachment: {
        file: {
          type: "image/png",
          size: 8000000
        }
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-attachment-add", ev);

    expect(wrapper.vm.rejectFile.calledOnce).toBe(true);
  });

  it("emits an image-rejected event if file is rejected", () => {
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload"
    });
    const ev = {
      preventDefault: sinon.fake(),
      attachment: {
        file: {
          type: "image/png",
          size: 8000000
        }
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-attachment-add", ev);

    const [emitted] = wrapper.emitted()["image-rejected"][0];
    expect(emitted.message).toBe("The image filesize exceeds the limit of 5MB");
    expect(emitted.file).toEqual({
      type: "image/png",
      size: 8000000
    });
  });

  it("accepts files under the file size limit in MB given in the maxImageFileSize prop", () => {
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload",
      maxImageFileSize: 10
    });
    wrapper.setMethods({ processFile: sinon.fake(), rejectFile: sinon.fake() });
    const ev = {
      attachment: {
        file: {
          type: "image/png",
          size: 8000000
        }
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-attachment-add", ev);

    expect(wrapper.vm.rejectFile.calledOnce).toBe(false);

    expect(
      wrapper.vm.processFile.calledWith(
        new ImageAttachment({
          file: {
            type: "image/png",
            size: 8000000
          }
        })
      )
    ).toBe(true);
  });

  it("includes a file input to add images when a image upload path is supplied", () => {
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload"
    });
    const file_input = wrapper.find("input[type=file]");

    expect(file_input.element).toBeDefined();
  });

  it("does not include a file input to add images when a image upload path is not supplied", () => {
    const wrapper = getWrapper();
    const file_input = wrapper.find("input[type=file]");
    expect(file_input.element).not.toBeDefined();
  });

  it("processes a valid file from the file input change event", () => {
    const wrapper = getWrapper({ imageUploadPath: "/test-upload" });
    const attachment = {
      file: {
        type: "image/test",
        size: 12345
      }
    };
    //in jsdom there is currently no access to trix.editor, so we test this in a round about way
    const editor = wrapper.find("trix-editor");
    let insertImageCalled = false;
    const insertImage = () => {
      insertImageCalled = true;
      editor.trigger("trix-attachment-add", { attachment });
    };
    wrapper.setMethods({ processFile: sinon.fake(), insertImage: insertImage });
    const file_input = wrapper.find("input[type=file]");

    file_input.trigger("change");
    expect(
      wrapper.vm.processFile.calledWith(
        new ImageAttachment({
          file: {
            type: "image/test",
            size: 12345
          }
        })
      )
    ).toBe(true);
    expect(insertImageCalled).toBe(true);
  });

  it("emits a image-attached event on successful upload", done => {
    moxios.install();
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload"
    });
    const editor = wrapper.find("trix-editor");
    const attachment = {
      file: {
        type: "image/png",
        size: 1000
      },
      setAttributes: () => {}
    };

    moxios.stubRequest("/test-upload", {
      status: 200,
      response: { src: "pic.jpg" }
    });

    editor.trigger("trix-attachment-add", { attachment });

    moxios.wait(() => {
      const emitted = wrapper.emitted()["image-attached"];
      expect(emitted).toBeDefined();
      moxios.uninstall();
      done();
    });
  });

  it("emits an image-rejected event if upload failed", done => {
    moxios.install();
    const wrapper = getWrapper({
      imageUploadPath: "/test-upload"
    });
    const editor = wrapper.find("trix-editor");
    const attachment = {
      file: {
        type: "image/png",
        size: 1000
      },
      setAttributes: () => {}
    };

    moxios.stubRequest("/test-upload", {
      status: 500
    });

    editor.trigger("trix-attachment-add", { attachment });

    moxios.wait(() => {
      const [emitted] = wrapper.emitted()["image-rejected"][0];
      expect(emitted).toBeDefined();
      expect(emitted.file).toEqual(attachment.file);
      expect(emitted.message).toBe("Upload failed with 500 response");
      moxios.uninstall();
      done();
    });
  });

  it("posts the content to the given url if save path prop is provided", done => {
    moxios.install();
    const wrapper = getWrapper({
      savePath: "/test-save-url"
    });

    wrapper.setMethods({ content: () => "<p>Some test content</p>" });

    const save_button = wrapper.find("button.dd_save-content");
    save_button.trigger("click");

    moxios.wait(() => {
      const req = moxios.requests.mostRecent();
      expect(req.url).toBe("/test-save-url");
      expect(req.config.data).toEqual(
        JSON.stringify({ content: "<p>Some test content</p>" })
      );
      moxios.uninstall();
      done();
    });
  });

  it("hides the save button if no save path prop is provided", () => {
    const wrapper = getWrapper({
      initialContent: "<p>Some test content</p>"
    });

    const save_button = wrapper.find("button.dd_save-content");
    expect(save_button.element.style.display).toBe("none");
  });

  it("emits a content-saved event if content saved successfully", done => {
    moxios.install();
    const wrapper = getWrapper({
      initialContent: "<p>Some test content</p>",
      savePath: "/test-save-url"
    });

    moxios.stubRequest("/test-save-url", { status: 200 });

    const save_button = wrapper.find("button.dd_save-content");
    save_button.trigger("click");

    moxios.wait(() => {
      expect(wrapper.emitted()["content-saved"]).toBeDefined();
      moxios.uninstall();
      done();
    });
  });

  it("emits a content-ave-failed event with fail response if save request fails", done => {
    moxios.install();
    const wrapper = getWrapper({
      initialContent: "<p>Some test content</p>",
      savePath: "/test-save-url"
    });

    moxios.stubRequest("/test-save-url", {
      status: 500,
      response: { error: "That failed" }
    });

    const save_button = wrapper.find("button.dd_save-content");
    save_button.trigger("click");

    moxios.wait(() => {
      expect(wrapper.emitted()["content-save-failed"]).toBeDefined();
      moxios.uninstall();
      done();
    });
  });

  it("saves content on time if a save timer prop is passed", done => {
    const wrapper = getWrapper({
      initialContent: "<p>Some test content</p>",
      savePath: "/test-save-url",
      saveInterval: 0.1
    });
    const save = sinon.fake();
    wrapper.setMethods({ saveContent: save, documentChanged: () => true });

    wait(0.2).then(() => {
      expect(save.called).toBe(true);
      done();
    });
  });

  it("will not attempt to auto save if there is no save path", done => {
    const wrapper = getWrapper({
      initialContent: "<p>Some test content</p>",
      saveInterval: 0.1
    });
    const save = sinon.fake();
    wrapper.setMethods({ saveContent: save, documentChanged: () => true });

    wait(0.2).then(() => {
      expect(save.called).toBe(false);
      done();
    });
  });

  it("will not try save if the current document is equal to the last saved document", done => {
    const wrapper = getWrapper({
      initialContent: "<p>Some test content</p>",
      savePath: "/test-save-url",
      saveInterval: 0.1
    });
    const save = sinon.fake();
    wrapper.setMethods({ documentChanged: () => false });

    wait(0.2).then(() => {
      expect(save.called).toBe(false);
      done();
    });
  });
});
