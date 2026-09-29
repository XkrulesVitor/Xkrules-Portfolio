import { Bvh } from '@react-three/drei'
import { Chair } from '../hotspots/chair/Chair'
import { Desk } from '../hotspots/desk/Desk'
import { Printer } from '../hotspots/printer/Printer'
import { Shelf } from '../hotspots/shelf/Shelf'
import { Lights } from './Lights'
import { Room } from './Room'

// Grey-box: ~23 draw calls (room 1, desk 1+4, chair 1, printer 6, shelf 1+1+8). Meta: < 120 (§7).
export function Scene() {
  return (
    <>
      <color attach="background" args={['#0b1020']} />
      <Lights />
      <Bvh>
        <Room />
        <Desk />
        <Chair />
        <Printer />
        <Shelf />
      </Bvh>
    </>
  )
}
