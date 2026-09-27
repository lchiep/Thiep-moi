import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { FolderAssets } from './folderAssets'
import { TICKET_SIZE } from '../Ticket/drawTicket'
import { CARD_SIZE } from './drawInvitationCard'

/**
 * TẬP TÀI LIỆU NHỰA PP ĐEN NHÁM — mô hình 3D thật.
 * Nằm phẳng trên giường (mặt phẳng y = 0). Đơn vị: 1 = bề ngang một trang.
 *
 *   root ─┬─ bìa sau (trang phải) + túi chéo + 2 vé
 *         ├─ gáy
 *         └─ coverPivot (trục = gáy trái) ── bìa trước + thiệp (mặt trong)
 *
 * GSAP điều khiển: root (vị trí/xoay), coverPivot.rotation.z (mở bìa),
 * tickets[i] (vé trồi lên). React chỉ dựng hình, không animate.
 */
export const FOLDER = {
  W: 1,
  D: 1.36,
  T: 0.009, // độ dày tấm bìa
  gap: 0.018, // khoảng chứa giấy giữa 2 bìa
} as const

export type TicketPose = { x: number; y: number; z: number; rot: number }
export const TICKET_POSES: { inside: TicketPose; out: TicketPose }[] = [
  // 2 vé DỰNG ĐỨNG cắm SÂU trong túi chéo: chỉ lộ phần đầu (chữ GRADUATION GALA),
  // ảnh khách còn giấu trong túi → chạm lần nữa mới rút vé ra (bất ngờ)
  { inside: { x: -0.18, y: 0.0035, z: 0.19, rot: 0.01 }, out: { x: -0.19, y: 0.0035, z: 0.145, rot: 0.05 } },
  { inside: { x: 0.19, y: 0.002, z: 0.13, rot: -0.01 }, out: { x: 0.2, y: 0.002, z: 0.075, rot: -0.06 } },
]

/** Vé chính khi được rút ra, bay lên trước mặt người xem (toạ độ trong root, tính cho camera lúc mở). */
export const TICKET_SHOW = { x: -0.5, y: 2.0, z: 0.02, tilt: THREE.MathUtils.degToRad(24), scale: 2.2 } as const

export type FolderHandle = {
  root: THREE.Group
  coverPivot: THREE.Group
  tickets: THREE.Group[]
  card: THREE.Mesh
}

const CARD_W = 0.6 // thiệp bên trái
const TICKET_W = 0.95 // chiều dài vé (nằm dọc theo trang sau khi dựng đứng)
const TICKET_H = TICKET_W * (TICKET_SIZE.h / TICKET_SIZE.w)

export const Folder3D = forwardRef<FolderHandle, { assets: FolderAssets }>(function Folder3D({ assets }, ref) {
  const root = useRef<THREE.Group>(null!)
  const coverPivot = useRef<THREE.Group>(null!)
  const t0 = useRef<THREE.Group>(null!)
  const t1 = useRef<THREE.Group>(null!)
  const card = useRef<THREE.Mesh>(null!)
  useImperativeHandle(ref, () => ({ root: root.current, coverPivot: coverPivot.current, tickets: [t0.current, t1.current], card: card.current }))

  const { W, D, T, gap } = FOLDER

  // nhựa PP đen nhám: hơi bóng, vân vỏ cam li ti
  const pp = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#0d0e10',
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.55,
        clearcoatRoughness: 0.32,
        bumpMap: assets.ppBump,
        bumpScale: 0.35,
      }),
    [assets.ppBump],
  )
  const coverTop = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: assets.cover,
        roughness: 0.5,
        clearcoat: 0.55,
        clearcoatRoughness: 0.32,
        bumpMap: assets.ppBump,
        bumpScale: 0.35,
      }),
    [assets.cover, assets.ppBump],
  )
  const pocketMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1d1e22',
        roughness: 0.5,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
        bumpMap: assets.ppBump,
        bumpScale: 0.3,
        side: THREE.DoubleSide,
      }),
    [assets.ppBump],
  )
  const paperMat = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.86, metalness: 0, transparent: true, alphaTest: 0.5 })
  const cardMat = useMemo(() => paperMat(assets.card), [assets.card])
  const ticketMats = useMemo(() => [paperMat(assets.ticketMain), paperMat(assets.ticketCopy)], [assets.ticketMain, assets.ticketCopy])

  // túi chéo ở nửa dưới trang phải: mép trên chạy xiên (trái thấp, phải cao)
  const pocketGeo = useMemo(() => {
    const s = new THREE.Shape()
    // toạ độ (x, z) trên mặt trang; shape vẽ trong mặt XY rồi xoay nằm phẳng
    // shape.y → trục z thế giới sau khi xoay (z dương = phía dưới màn hình)
    s.moveTo(-W / 2 + 0.02, D / 2 - 0.02)
    s.lineTo(W / 2 - 0.02, D / 2 - 0.02)
    s.lineTo(W / 2 - 0.02, -0.04)
    s.lineTo(-W / 2 + 0.02, 0.2)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.0025, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.0012, bevelSegments: 2 })
    return g
  }, [W, D])

  const coverY = T + gap

  return (
    <group ref={root}>
      {/* bìa sau = trang phải */}
      <RoundedBox args={[W, T, D]} radius={0.004} smoothness={3} position={[0, T / 2, 0]} castShadow receiveShadow material={pp} />

      {/* 2 vé: nằm trong túi, sẽ trồi lên */}
      {[t0, t1].map((r, i) => {
        const p = TICKET_POSES[i].inside
        return (
          <group key={i} ref={r} position={[p.x, T + p.y, p.z]} rotation={[0, p.rot, 0]}>
            {/* xoay -90°: tiêu đề vé lên trên, cuống vé xuống dưới (nằm trong túi) */}
            <group rotation={[0, -Math.PI / 2, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow material={ticketMats[i]}>
                <planeGeometry args={[TICKET_W, TICKET_H]} />
              </mesh>
            </group>
          </group>
        )
      })}

      {/* túi chéo (che phần dưới vé → vé thật sự nằm TRONG túi) */}
      <mesh geometry={pocketGeo} material={pocketMat} rotation={[Math.PI / 2, 0, 0]} position={[0, T + 0.011, 0]} castShadow receiveShadow />

      {/* gáy */}
      <RoundedBox args={[0.022, coverY + T, D]} radius={0.006} smoothness={3} position={[-W / 2 - 0.008, (coverY + T) / 2, 0]} castShadow receiveShadow material={pp} />

      {/* bìa trước: xoay quanh gáy trái */}
      <group ref={coverPivot} position={[-W / 2, coverY, 0]}>
        <RoundedBox args={[W, T, D]} radius={0.004} smoothness={3} position={[W / 2, T / 2, 0]} castShadow receiveShadow material={pp} />
        {/* lớp mặt ngoài có chữ ép chìm */}
        <mesh position={[W / 2, T + 0.0006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={coverTop} receiveShadow>
          <planeGeometry args={[W - 0.012, D - 0.012]} />
        </mesh>
        {/* thiệp kẹp ở mặt trong bìa (úp xuống khi đóng, ngửa lên khi mở) */}
        {/* tỉ lệ = tờ giấy thiệp DOM (≈0.47) → khi camera zoom vào, thiệp 3D "trở thành" màn thiệp liền mạch */}
        <mesh ref={card} position={[W / 2, -0.0025, 0]} rotation={[Math.PI / 2, 0, 0]} material={cardMat} castShadow receiveShadow>
          <planeGeometry args={[CARD_W, CARD_W / (CARD_SIZE.w / CARD_SIZE.h)]} />
        </mesh>
      </group>
    </group>
  )
})
