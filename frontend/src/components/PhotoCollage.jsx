import collageImg from '../assets/collage.png'  // ← el nombre que le pongas

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