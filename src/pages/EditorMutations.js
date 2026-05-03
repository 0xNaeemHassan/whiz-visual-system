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

export const MUTATION_PATH_MATRIX = {
  text_edits: { target: 'content', immediate: false, requiresCommit: true },
  theme_frame_changes: { target: 'overrides', immediate: true, requiresCommit: false },
  strict_polish_apply: { target: 'overrides', immediate: true, requiresCommit: false },
  media_upload_move_transform: { target: 'media', immediate: true, requiresCommit: false },
  import_load_reset_actions: { target: 'any', immediate: true, requiresCommit: false },
  template_apply_save_load_flows: { target: 'any', immediate: true, requiresCommit: false },
};

export function getMutationPathContract(path) {
  return MUTATION_PATH_MATRIX[path] || null;
}

export function getContentMutationOptions(field, forceImmediate = false) {
  if (forceImmediate) return { immediate: true };
  return { immediate: !CONTENT_DEBOUNCED_FIELDS.has(field) };
}

export function buildMutationDispatcher({ setContent, setOverrides, setMedia, commitContent, commitOverrides, commitMedia }) {
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
    commit(path) {
      const contract = getMutationPathContract(path);
      if (!contract?.requiresCommit) return false;
      if (contract.target === 'content') return Boolean(commitContent?.());
      if (contract.target === 'overrides') return Boolean(commitOverrides?.());
      if (contract.target === 'media') return Boolean(commitMedia?.());
      return false;
    },
  };
}
