<template>
  <modals-modal v-model="show" name="edit-collection" :width="700" :height="'unset'" :processing="processing">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ $strings.HeaderCollection }}</p>
      </div>
    </template>
    <div class="p-4 w-full text-sm py-6 rounded-lg bg-bg shadow-lg border border-black-300 relative overflow-hidden" style="min-height: 400px; max-height: 80vh">
      <template v-if="!showImageUploader">
        <form @submit.prevent="submitForm">
          <div class="flex flex-wrap">
            <div class="w-full flex justify-center mb-2 md:w-auto md:mb-0 md:block">
              <div class="relative group cursor-pointer" @click="showImageUploader = true">
                <covers-collection-cover :collection="collection" :book-items="books" :width="200" :height="100 * bookCoverAspectRatio" :book-cover-aspect-ratio="bookCoverAspectRatio" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xs">
                  <span class="material-symbols text-white text-3xl">edit</span>
                </div>
              </div>
              <ui-btn v-if="collection.coverPath" small color="bg-error" type="button" class="mt-2 w-full" @click.stop="removeCover">{{ $strings.ButtonRemoveCover || 'Remove Cover' }}</ui-btn>
            </div>
            <div class="grow px-4">
              <ui-text-input-with-label v-model="newCollectionName" :label="$strings.LabelName" class="mb-2" />

              <ui-textarea-with-label v-model="newCollectionDescription" :label="$strings.LabelDescription" />
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 w-full py-4 px-4 flex">
            <ui-btn v-if="userCanDelete" small color="bg-error" type="button" @click.stop="removeClick">{{ $strings.ButtonRemove }}</ui-btn>
            <div class="grow" />
            <ui-btn color="bg-success" type="submit">{{ $strings.ButtonSave }}</ui-btn>
          </div>
        </form>
      </template>
      <template v-else>
        <div class="flex items-center mb-3">
          <div class="hover:bg-white/10 cursor-pointer h-11 w-11 flex items-center justify-center rounded-full" @click="showImageUploader = false">
            <span class="material-symbols text-4xl">arrow_back</span>
          </div>
          <p class="ml-2 text-xl mb-1">{{ $strings.HeaderChangeCover || 'Collection Cover Image' }}</p>
        </div>

        <!-- File upload -->
        <div class="flex items-center mb-4">
          <ui-btn small class="mr-2 shrink-0" @click="$refs.coverFileInput.click()">{{ $strings.ButtonUpload || 'Upload' }}</ui-btn>
          <p class="text-gray-400 text-xs">{{ $strings.LabelOrEnterURL || 'or enter a URL:' }}</p>
          <input ref="coverFileInput" type="file" accept="image/*" class="hidden" @change="coverFileSelected" />
        </div>

        <!-- URL input -->
        <div class="flex mb-6">
          <ui-text-input v-model="newCoverUrl" class="grow mr-2" placeholder="https://..." />
          <ui-btn small color="bg-success" :disabled="!newCoverUrl" @click="uploadCoverFromUrl">{{ $strings.ButtonSave || 'Save' }}</ui-btn>
        </div>
      </template>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {
      processing: false,
      newCollectionName: null,
      newCollectionDescription: null,
      showImageUploader: false,
      newCoverUrl: ''
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal) {
          this.init()
        }
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.globals.showEditCollectionModal
      },
      set(val) {
        this.$store.commit('globals/setShowEditCollectionModal', val)
      }
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    collection() {
      return this.$store.state.globals.selectedCollection || {}
    },
    collectionName() {
      return this.collection.name
    },
    books() {
      return this.collection.books || []
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    }
  },
  methods: {
    init() {
      this.newCollectionName = this.collectionName
      this.newCollectionDescription = this.collection.description || ''
      this.showImageUploader = false
      this.newCoverUrl = ''
    },
    removeClick() {
      const payload = {
        message: this.$getString('MessageConfirmRemoveCollection', [this.collectionName]),
        callback: (confirmed) => {
          if (confirmed) {
            this.deleteCollection()
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    deleteCollection() {
      this.processing = true
      this.$axios
        .$delete(`/api/collections/${this.collection.id}`)
        .then(() => {
          this.show = false
          this.$toast.success(this.$strings.ToastCollectionRemoveSuccess)
        })
        .catch((error) => {
          console.error('Failed to remove collection', error)
          this.$toast.error(this.$strings.ToastRemoveFailed)
        })
        .finally(() => {
          this.processing = false
        })
    },
    submitForm() {
      if (this.newCollectionName === this.collectionName && this.newCollectionDescription === this.collection.description) {
        return
      }
      if (!this.newCollectionName) {
        return this.$toast.error(this.$strings.ToastNameRequired)
      }

      this.processing = true

      var collectionUpdate = {
        name: this.newCollectionName,
        description: this.newCollectionDescription || null
      }
      this.$axios
        .$patch(`/api/collections/${this.collection.id}`, collectionUpdate)
        .then((collection) => {
          console.log('Collection Updated', collection)
          this.processing = false
          this.show = false
          this.$toast.success(this.$strings.ToastCollectionUpdateSuccess)
        })
        .catch((error) => {
          console.error('Failed to update collection', error)
          this.processing = false
          this.$toast.error(this.$strings.ToastFailedToUpdate)
        })
    },
    updateStoreCover(coverPath) {
      const updated = Object.assign({}, this.collection, { coverPath, lastUpdate: Date.now() })
      this.$store.commit('globals/setSelectedCollection', updated)
    },
    coverFileSelected(event) {
      const file = event.target.files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('cover', file)

      this.processing = true
      this.$axios
        .post(`/api/collections/${this.collection.id}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          if (response.data?.cover) this.updateStoreCover(response.data.cover)
          this.showImageUploader = false
          this.$toast.success(this.$strings.ToastCoverUpdateSuccess || 'Cover updated')
        })
        .catch((error) => {
          console.error('Failed to upload cover', error)
          this.$toast.error(this.$strings.ToastFailedToUpdate)
        })
        .finally(() => {
          this.processing = false
          event.target.value = ''
        })
    },
    uploadCoverFromUrl() {
      if (!this.newCoverUrl) return

      this.processing = true
      this.$axios
        .$post(`/api/collections/${this.collection.id}/cover`, { url: this.newCoverUrl })
        .then((data) => {
          if (data?.cover) this.updateStoreCover(data.cover)
          this.showImageUploader = false
          this.newCoverUrl = ''
          this.$toast.success(this.$strings.ToastCoverUpdateSuccess || 'Cover updated')
        })
        .catch((error) => {
          console.error('Failed to upload cover from url', error)
          this.$toast.error(this.$strings.ToastFailedToUpdate)
        })
        .finally(() => {
          this.processing = false
        })
    },
    removeCover() {
      this.processing = true
      this.$axios
        .$delete(`/api/collections/${this.collection.id}/cover`)
        .then(() => {
          this.updateStoreCover(null)
          this.$toast.success(this.$strings.ToastCoverRemoveSuccess || 'Cover removed')
        })
        .catch((error) => {
          console.error('Failed to remove cover', error)
          this.$toast.error(this.$strings.ToastRemoveFailed)
        })
        .finally(() => {
          this.processing = false
        })
    }
  },
  mounted() {},
  beforeDestroy() {}
}
</script>
