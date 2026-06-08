import { ArrowUpRight, CheckCircle2, Globe } from "lucide-react";
import { Badge } from "./badge";
import { buttonVariants } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";

export type PostCardProps = {
  label: string;
  description: string | null;
  link: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  isGlobal: boolean;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function PostCard({
  label,
  description,
  link,
  logoUrl,
  isVerified,
  isGlobal,
  createdAt,
}: PostCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="size-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10">
            {logoUrl ? (
              // biome-ignore lint/performance/noImgElement: arbitrary external logo URL
              <img
                src={logoUrl}
                alt=""
                width={56}
                height={56}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                <Globe className="size-6" />
              </div>
            )}
          </div>
          {(isVerified || isGlobal) && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {isVerified && (
                <Badge variant="secondary">
                  <CheckCircle2 /> Verified
                </Badge>
              )}
              {isGlobal && (
                <Badge variant="outline">
                  <Globe /> Global
                </Badge>
              )}
            </div>
          )}
        </div>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {description}
          </p>
        </CardContent>
      )}
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          Added {dateFormatter.format(new Date(createdAt))}
        </span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Learn More
            <ArrowUpRight />
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
