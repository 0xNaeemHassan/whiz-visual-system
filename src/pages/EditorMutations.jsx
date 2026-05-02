export const CONTENT_DEBOUNCED_FIELDS = new Set([
  'issueNum','date','desk','volume','topicTag','handle','socialX','socialSub','status','nextDrop','pullQuote','heroUrl','logoUrl',
  'title','deck','body','verdict','bigLabel','bigNumber','sparkData','sourceLinks',
]);

export const MUTATION_INVENTORY = {
  content_text: { target: 'content', immediate: false },
  content_structural: { target: 'content', immediate: true },
  style: { target: 'overrides', immediate: true },
  image: { target: 'media', immediate: true },
  reset: { target: 'any', immediate: true },
};

export function getContentMutationOptions(field, forceImmediate = false) {
  if (forceImmediate) return { immediate: true };
  return { immediate: !CONTENT_DEBOUNCED_FIELDS.has(field) };
}

export function buildMutationDispatcher({ setContent, setOverrides, setMedia }) {
  return {
    content(field, updater, forceImmediate = false) {
      return setContent(updater, getContentMutationOptions(field, forceImmediate));
    },
    style(updater) {
      return setOverrides(updater, { immediate: true });
    },
    image(updater) {
      return setMedia(updater, { immediate: true });
    },
  };
}
