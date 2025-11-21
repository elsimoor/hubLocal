"use client";
import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";

interface Props {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGalleryModal({ images, isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-4 max-w-[90%] w-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="rounded-xl"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <img
                src={img}
                className="w-full h-[350px] object-cover rounded-xl"
                alt=""
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          className="mt-4 w-full bg-black text-white py-2 rounded-lg"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
