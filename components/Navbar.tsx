
import Image from "next/image"
import Link from "next/link"
import NavItems from "./NavItems"



import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

const Navbar = async () => {
  const { userId } = await auth();
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
         {!userId && (
           <>
             <SignInButton mode="modal">
               <button className="btn-signin">Sign In</button>
             </SignInButton>
             <SignUpButton mode="modal">
               <button className="btn-secondary">Sign Up</button>
             </SignUpButton>
           </>
         )}
         {userId && ( 
           <UserButton />
         )}
       </div>
      
    </nav>
  )
}

export default Navbar
