<template>
  <div class="relative rounded-xs overflow-hidden" :style="{ width: width + 'px', height: height + 'px' }">
    <div v-if="hasOwnCover" class="w-full h-full relative rounded-xs">
      <div v-if="showCoverBg" class="bg-primary absolute top-0 left-0 w-full h-full">
        <div class="w-full h-full z-0" ref="coverBg" />
      </div>
      <img ref="cover" :src="fullCoverUrl" @error="imageError" @load="imageLoaded" class="w-full h-full absolute top-0 left-0" :class="showCoverBg ? 'object-contain' : 'object-cover'" />
    </div>
    <div v-else-if="books.length" class="flex justify-center h-full relative bg-primary/95 rounded-xs">
      <div class="absolute top-0 left-0 w-full h-full bg-gray-400/5" />

      <covers-book-cover :library-item="books[0]" :width="width / 2" :book-cover-aspect-ratio="bookCoverAspectRatio" />
      <covers-book-cover v-if="books.length > 1" :library-item="books[1]" :width="width / 2" :book-cover-aspect-ratio="bookCoverAspectRatio" />
    </div>
    <div v-else class="relative w-full h-full flex items-center justify-center p-2 bg-primary rounded-xs">
      <div class="absolute top-0 left-0 w-full h-full bg-gray-400/5" />

      <p class="text-white/60 text-center" :style="{ fontSize: Math.min(1, sizeMultiplier) + 'rem' }">Empty Collection</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    collection: {
      type: Object,
      default: () => null
    },
    bookItems: {
      type: Array,
      default: () => []
    },
    width: Number,
    height: Number,
    bookCoverAspectRatio: Number
  },
  data() {
    return {
      imageFailed: false,
      showCoverBg: false
    }
  },
  computed: {
    sizeMultiplier() {
      if (this.bookCoverAspectRatio === 1) return this.width / (120 * 1.6 * 2)
      return this.width / 240
    },
    hasOwnCover() {
      return !this.imageFailed && !!this.collection?.coverPath
    },
    fullCoverUrl() {
      if (!this.collection?.coverPath) return null
      const base = this.$store?.state?.routerBasePath || ''
      return `${base}/api/collections/${this.collection.id}/cover?ts=${this.collection.lastUpdate || Date.now()}`
    },
    books() {
      return this.bookItems || []
    }
  },
  methods: {
    imageError() {
      this.imageFailed = true
    },
    imageLoaded() {
      if (this.$refs.cover) {
        const { naturalWidth, naturalHeight } = this.$refs.cover
        const coverAspect = naturalWidth / naturalHeight
        const containerAspect = this.width / this.height
        this.showCoverBg = Math.abs(coverAspect - containerAspect) > 0.15
      }
    }
  },
  watch: {
    'collection.coverPath'() {
      this.imageFailed = false
    }
  },
  mounted() {}
}
</script>
