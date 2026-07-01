
import Image from "next/image"
import Link from "next/link"
import NavItems from "./NavItems"



const Navbar = () => {
  return (
    <nav className="navbar">
       <Link href="/">
         <div className="flex items-center gap-2.5 cursor-pointer">
           <Image 
             src="/images/logo.svg.png"
             alt="" 
             width={120}
             height={120}
             style={{ width: "auto", height: "auto" }}/>

         </div>
       </Link>
       <div className="flex items-center gap-8">
         <NavItems/>
         <p>Sign In</p>
       </div>
      
    </nav>
  )
}

export default Navbar
