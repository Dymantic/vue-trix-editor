import { shallowMount } from "@vue/test-utils";
import TrixVueWysiwyg from "@/components/TrixVueWysiwyg.vue";

describe("TrixVueWysiwyg.vue", () => {
  it("passes a test", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      propsData: {
        content: "<h1>Test It!</h1>"
      }
    });
    expect(wrapper.text()).toMatch("");
  });

  it("uses the content prop in the trix editor", () => {
    const wrapper = shallowMount(TrixVueWysiwyg, {
      propsData: {
        content: "<h1>Test It!</h1>"
      }
    });
    const editor = wrapper.find("#dd-trix-editor-input");

    expect(editor.element.value).toBe("<h1>Test It!</h1>");
  });
});
