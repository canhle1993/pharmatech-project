(function initProductSwiper() {
  function initialize() {
    if (typeof Swiper === "undefined") {
      console.warn("⚠️ Swiper chưa sẵn sàng, thử lại sau...");
      setTimeout(initialize, 300);
      return;
    }

    // ✅ Chỉ tìm trong vùng sản phẩm chính, tránh đụng "Related Product"
    const wrapper = document.querySelector(".product-details-img");
    if (!wrapper) {
      console.warn("⚠️ Không tìm thấy .product-details-img, thử lại...");
      setTimeout(initialize, 300);
      return;
    }

    const mainContainer = wrapper.querySelector(".single-product-vertical-tab");
    const thumbContainer = wrapper.querySelector(".product-thumb-vertical");
    const nextBtn = wrapper.querySelector(".swiper-button-next");
    const prevBtn = wrapper.querySelector(".swiper-button-prev");

    if (!mainContainer || !thumbContainer) {
      console.warn("⚠️ Không tìm thấy container Swiper trong DOM.");
      return;
    }

    // ✅ Hủy instance cũ (nếu có)
    if (mainContainer.swiper) mainContainer.swiper.destroy(true, true);
    if (thumbContainer.swiper) thumbContainer.swiper.destroy(true, true);

    // ✅ Swiper Thumbnail
    const thumbs = new Swiper(thumbContainer, {
      direction: "vertical",
      slidesPerView: 4,
      spaceBetween: 10,
      watchSlidesProgress: true,
      watchOverflow: true,
      slideToClickedSlide: true,
      observer: true,
      observeParents: true,
    });

    // ✅ Swiper Chính
    const mainSwiper = new Swiper(mainContainer, {
      spaceBetween: 10,
      slidesPerView: 1,
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn,
      },
      thumbs: { swiper: thumbs },
      observer: true,
      observeParents: true,
    });

    console.log("✅ Swiper Product Detail khởi tạo OK!");
  }

  // 🔁 Chờ DOM Angular render xong ảnh
  const observer = new MutationObserver(() => {
    const galleryReady = document.querySelector(
      ".product-details-img .single-product-vertical-tab .swiper-slide"
    );
    if (galleryReady) {
      observer.disconnect();
      setTimeout(initialize, 300);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
