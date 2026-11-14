CREATE TABLE "sessao_revogada" (
	"jti" varchar(64) PRIMARY KEY NOT NULL,
	"usuario_id" bigint NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"revogada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessao_revogada" ADD CONSTRAINT "sessao_revogada_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_sessao_revogada_expira" ON "sessao_revogada" USING btree ("expira_em");
--> statement-breakpoint
ALTER TABLE "sessao_revogada" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE "sessao_revogada" FROM %I', papel);
    END IF;
  END LOOP;
END $$;