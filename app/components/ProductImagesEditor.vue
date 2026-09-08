<template>
  <div>
    <Label class="mb-4 block">Изображение</Label>

    <div class="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
      <div class="relative mx-auto h-[150px] w-full max-w-[200px] shrink-0 sm:mx-0 sm:w-[200px]">
        <div
          v-if="showPreview"
          class="h-[150px] w-full overflow-hidden rounded-sm border border-border bg-muted/20 sm:w-[200px]"
        >
          <img
            :key="previewSrc"
            :src="previewSrc"
            :alt="slug"
            class="h-[150px] w-full object-cover object-center sm:w-[200px]"
            @error="imageError = true"
            @load="imageError = false"
          />
        </div>

        <div
          v-else
          class="flex h-[150px] w-full items-center justify-center rounded-sm border border-dashed border-border bg-muted/10 px-4 text-center text-sm text-muted-foreground sm:w-[200px]"
        >
          Изображение не выбрано
        </div>

        <div
          v-if="busy"
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-sm bg-background/75 backdrop-blur-[1px]"
        >
          <Loader2 class="size-6 animate-spin text-primary" />
          <span class="text-xs text-muted-foreground">{{ busyLabel }}</span>
        </div>
      </div>

      <div class="flex min-w-0 flex-1 flex-col items-stretch justify-start gap-3 sm:items-end">
        <input
          ref="inputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          :disabled="busy || !slug"
          @change="onSelected"
        />

        <div class="flex flex-wrap justify-stretch gap-2 sm:justify-end">
          <Button
            type="button"
            variant="magnetic-filled"
            class="flex-1 sm:flex-none"
            :disabled="busy || !slug"
            @click="onUploadClick"
          >
            {{ hasImage ? 'Заменить картинку' : 'Загрузить картинку' }}
          </Button>
          <Button
            v-if="hasImage"
            type="button"
            variant="outline"
            class="flex-1 sm:flex-none"
            :disabled="busy"
            @click="onRemoveClick"
          >
            Удалить
          </Button>
        </div>

        <p v-if="!slug" class="text-center text-xs text-muted-foreground sm:text-right">
          Сначала укажите slug товара
        </p>
        <p v-else class="text-center text-xs text-muted-foreground sm:text-right">
          JPEG, PNG или WebP, до 100 МБ
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  slug: string
  image: string
}>()

const emit = defineEmits<{
  'update:image': [value: string]
  saved: []
}>()

const products = useProductsStore()
const { resolveImageUrl } = useProductImageUrl()
const { assertCanEdit } = useCanEdit()

const inputRef = ref<HTMLInputElement | null>(null)
const processing = ref(false)
const action = ref<'upload' | 'save' | 'remove'>('upload')
const imageError = ref(false)
const previewVersion = ref(0)
const pendingFile = ref<File | null>(null)
const pendingRemoval = ref(false)
const localPreviewUrl = ref<string | null>(null)

const hasImage = computed(
  () => Boolean(pendingFile.value) || (Boolean(props.image) && !pendingRemoval.value),
)

const previewSrc = computed(() => {
  if (localPreviewUrl.value) return localPreviewUrl.value
  if (pendingRemoval.value || imageError.value) return ''
  if (!props.image) return ''

  const url = resolveImageUrl(props.image)
  return previewVersion.value ? `${url}?v=${previewVersion.value}` : url
})

const showPreview = computed(() => Boolean(previewSrc.value))

const busy = computed(() => processing.value || products.uploadingImage || products.imageSaving)

const busyLabel = computed(() => {
  if (action.value === 'remove') return 'Удаление…'
  if (action.value === 'save') return 'Сохранение…'
  return 'Загрузка…'
})

const hasPendingChanges = computed(() => Boolean(pendingFile.value) || pendingRemoval.value)

function clearLocalPreview() {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = null
  }
}

function clearPending() {
  pendingFile.value = null
  pendingRemoval.value = false
  clearLocalPreview()
}

function onUploadClick() {
  if (!assertCanEdit()) return
  inputRef.value?.click()
}

function onSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  input.value = ''

  if (!file || !props.slug) return

  clearLocalPreview()
  pendingFile.value = file
  pendingRemoval.value = false
  localPreviewUrl.value = URL.createObjectURL(file)
  imageError.value = false
}

function onRemove() {
  clearLocalPreview()
  pendingFile.value = null
  pendingRemoval.value = Boolean(props.image)
  imageError.value = false
}

function onRemoveClick() {
  if (!assertCanEdit()) return
  onRemove()
}

async function commit(options?: { mode?: 'create' | 'edit' }) {
  const mode = options?.mode ?? 'edit'

  if (!props.slug) {
    return props.image
  }

  if (!hasPendingChanges.value) {
    return props.image
  }

  processing.value = true

  try {
    if (pendingRemoval.value && mode === 'edit') {
      action.value = 'remove'
      await products.removeProductImage(props.slug, { silent: true })
      clearPending()
      emit('update:image', '')
      emit('saved')
      return ''
    }

    if (pendingFile.value) {
      action.value = mode === 'create' ? 'upload' : 'save'
      const url = await products.uploadImage(pendingFile.value, {
        slug: props.slug,
        kind: 'main',
      })

      if (mode === 'edit') {
        await products.saveProductImage(props.slug, url, { silent: true })
      }

      clearPending()
      previewVersion.value += 1
      emit('update:image', url)
      emit('saved')
      return url
    }

    return props.image
  } finally {
    processing.value = false
    action.value = 'upload'
  }
}

watch(
  () => props.image,
  () => {
    imageError.value = false
  },
)

onBeforeUnmount(() => {
  clearLocalPreview()
})

defineExpose({
  commit,
  hasPendingChanges,
  clearPending,
})
</script>
