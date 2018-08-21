import { shallowMount } from "@vue/test-utils";
import TrixVueWysiwyg from "@/components/TrixVueWysiwyg.vue";
import sinon from "sinon";
import ImageAttachment from "@/ImageAttachment";
import moxios from "moxios";

describe("the TrixVue component", () => {
  it("has a default value for the unique id and input name for the trix editor", () => {
    const wrapper = shallowMount(TrixVueWysiwyg);
    const editor_input = wrapper.find("#dd-trix-input");
    const editor = wrapper.find("trix-editor");

    expect(editor_input.element).toBeDefined();
    expect(editor_input.element.tagName).toBe("INPUT");

    expect(editor.element.getAttribute("input")).toBe("dd-trix-input");
  });

  it("uses the initial content prop to populate the trix editor", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      propsData: {
        initialContent: "<h1>Test It!</h1>"
      }
    });
    const editor = wrapper.find("#dd-trix-input");

    expect(editor.element.value).toBe("<h1>Test It!</h1>");
  });

  it("can take the unique id and input name for the trix editor as a prop", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      propsData: {
        uniqueId: "unique-test-id"
      }
    });
    const editor_input = wrapper.find("#unique-test-id");
    const editor = wrapper.find("trix-editor");

    expect(editor.element).toBeDefined();
    expect(editor.element.getAttribute("input")).toBe("unique-test-id");
  });

  it("prevents file attachments if no image path prop is given", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true
    });
    const ev = {
      preventDefault: sinon.fake()
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-file-accept", ev);

    expect(ev.preventDefault.calledOnce).toBe(true);
  });

  it("it can process an attached file if there is an image upload path", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
    });
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload",
        maxImageFileSize: 10
      }
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
    });
    const file_input = wrapper.find("input[type=file]");

    expect(file_input.element).toBeDefined();
  });

  it("does not include a file input to add images when a image upload path is not supplied", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true
    });
    const file_input = wrapper.find("input[type=file]");
    expect(file_input.element).not.toBeDefined();
  });

  it("processes a valid file from the file input change event", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
    });
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
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
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true,
      propsData: {
        imageUploadPath: "/test-upload"
      }
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
});
