import { shallowMount } from "@vue/test-utils";
import TrixVueWysiwyg from "@/components/TrixVueWysiwyg.vue";
import sinon from "sinon";

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

  it("rejects file attachments if no image path prop is given", () => {
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
      file: {
        type: "text/html"
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-file-accept", ev);

    expect(ev.preventDefault.calledOnce).toBe(false);
    expect(wrapper.vm.processFile.calledOnce).toBe(true);
  });

  it("rejects file attachments if they are not images", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      attachToDocument: true
    });
    const ev = {
      preventDefault: sinon.fake(),
      file: {
        type: "text/html"
      }
    };
    const editor = wrapper.find("trix-editor");

    editor.trigger("trix-file-accept", ev);

    expect(ev.preventDefault.calledOnce).toBe(true);
  });
});
