import { shallowMount } from "@vue/test-utils";
import TrixVueWysiwyg from "@/components/TrixVueWysiwyg.vue";

describe("HelloWorld.vue", () => {
  it("passes a test", () => {
    const wrapper = shallowMount(TrixVueWysiwyg);
    expect(wrapper.text()).toMatch("");
  });
});
