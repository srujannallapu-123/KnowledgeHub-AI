import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn, getSubjectColor } from "@/lib/utils";
import { Companion } from "@/types";
import Image from "next/image";
import Link from "next/link";
import DeleteCompanionButton from "@/components/DeleteCompanionButton";

interface CompanionsListProps {
  title: string;
  companions?: Companion[];
  classNames?: string;
  showDelete?: boolean;
}

const CompanionsList = ({
  title,
  companions,
  classNames,
  showDelete = false,
}: CompanionsListProps) => {

  const uniqueCompanions = Array.from(
    new Map(
      (companions ?? []).map((companion) => [
        companion.id,
        companion,
      ])
    ).values()
  );

  return (
    <article className={cn("companion-list", classNames)}>
      <h2 className="font-bold text-3xl">{title}</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-lg w-2/3">
              Lessons
            </TableHead>

            <TableHead className="text-lg">
              Subject
            </TableHead>

            <TableHead className="text-lg text-right">
              Duration
            </TableHead>

            {showDelete && (
              <TableHead className="text-lg text-right">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {uniqueCompanions.map(
            ({ id, subject, name, topic, duration }) => (
              <TableRow key={id}>
                <TableCell>
                  <Link href={`/companions/${id}`}>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-[72px] flex justify-center items-center rounded-lg max-md:hidden"
                        style={{
                          backgroundColor: getSubjectColor(subject),
                        }}
                      >
                        <Image
                          src={`/icons/${subject}.svg`}
                          alt={subject}
                          width={35}
                          height={35}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-2xl">
                          {name}
                        </p>

                        <p className="text-lg">{topic}</p>
                      </div>
                    </div>
                  </Link>
                </TableCell>

                <TableCell>
                  <div className="subject-badge w-fit max-md:hidden">
                    {subject}
                  </div>

                  <div
                    className="flex justify-center items-center rounded-lg w-fit p-2 md:hidden"
                    style={{
                      backgroundColor: getSubjectColor(subject),
                    }}
                  >
                    <Image
                      src={`/icons/${subject}.svg`}
                      alt={subject}
                      width={18}
                      height={18}
                    />
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-center gap-2 w-full">
                    <p className="text-2xl">
                      {duration}{" "}
                      <span className="max-md:hidden">
                        mins
                      </span>
                    </p>

                    <Image
                      src="/icons/clock.svg"
                      alt="clock"
                      width={14}
                      height={14}
                      className="md:hidden"
                    />
                  </div>
                </TableCell>

                {showDelete && (
                  <TableCell className="text-right">
                    <DeleteCompanionButton
                      companionId={id}
                      companionName={name}
                    />
                  </TableCell>
                )}
              </TableRow>
            )
          )}

          {uniqueCompanions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={showDelete ? 4 : 3}
                className="py-8 text-center text-gray-500"
              >
                No companions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </article>
  );
};

export default CompanionsList;