import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getUserCompanions,
  getUserSessions,
  
} from "@/lib/actions/companion.actions";
import Image from "next/image";
import CompanionsList from "@/components/CompanionsList";

const Profile = async () => {
 const session = await auth();
const user = session?.user;

if (!user?.id) redirect("/sign-in");

  const companions = await getUserCompanions(user.id);
  const sessionHistory = await getUserSessions(user.id);
 

  return (
    <main className="min-lg:w-3/4">
      <section className="flex justify-between gap-4 max-sm:flex-col items-center">
        <div className="flex gap-4 items-center">
          <div className="flex size-[110px] items-center justify-center rounded-full bg-[#EB7410] text-4xl font-bold text-white">
    {user.name?.charAt(0).toUpperCase() ||
        user.email?.charAt(0).toUpperCase() ||
        "U"}
</div>

<div className="flex flex-col gap-2">
    <h1 className="font-bold text-2xl">
        {user.name || "User"}
    </h1>

    <p className="text-sm text-muted-foreground">
        {user.email}
    </p>
</div>
        </div>
        <div className="flex gap-4">
          <div className="border border-black rouded-lg p-3 gap-2 flex flex-col h-fit">
            <div className="flex gap-2 items-center">
              <Image
                src="/icons/check.svg"
                alt="checkmark"
                width={22}
                height={22}
              />
              <p className="text-2xl font-bold">{sessionHistory.length}</p>
            </div>
            <div>Lessons completed</div>
          </div>
          <div className="border border-black rouded-lg p-3 gap-2 flex flex-col h-fit">
            <div className="flex gap-2 items-center">
              <Image src="/icons/cap.svg" alt="cap" width={22} height={22} />
              <p className="text-2xl font-bold">{companions.length}</p>
            </div>
            <div>Companions created</div>
          </div>
        </div>
      </section>
      <Accordion type="multiple">
        <AccordionItem value="recent">
          <AccordionTrigger className="text-2xl font-bold">
            Recent Sessions
          </AccordionTrigger>
          <AccordionContent>
            <CompanionsList
              title="Recent Sessions"
              companions={sessionHistory}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="companions">
          <AccordionTrigger className="text-2xl font-bold">
            My Companions {`(${companions.length})`}
          </AccordionTrigger>
          <AccordionContent>
           <CompanionsList
              title="My Companions"
              companions={companions}
              showDelete={true}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
};
export default Profile;