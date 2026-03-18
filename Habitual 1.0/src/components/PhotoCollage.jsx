import collageImg from '../assets/collage.jpg'  // ← el nombre que le pongas

export default function PhotoCollage() {
  return (
    <img
      src={collageImg}
      alt=""
      className="hb-collage-img"
      aria-hidden="true"
    />
  )
}