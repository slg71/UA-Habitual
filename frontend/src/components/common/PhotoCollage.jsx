import collageImg from '../../assets/collage.png'

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