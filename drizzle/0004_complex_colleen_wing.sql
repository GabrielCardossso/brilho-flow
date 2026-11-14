CREATE TABLE "controle_rate_limit" (
	"chave" varchar(200) PRIMARY KEY NOT NULL,
	"janela_inicio" timestamp with time zone NOT NULL,
	"contagem" integer DEFAULT 0 NOT NULL,
	"bloqueado_ate" timestamp with time zone,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_controle_rate_limit_contagem" CHECK ("controle_rate_limit"."contagem" >= 0)
);
--> statement-breakpoint
CREATE INDEX "ix_controle_rate_limit_atualizado" ON "controle_rate_limit" USING btree ("atualizado_em");
--> statement-breakpoint
ALTER TABLE "controle_rate_limit" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
DECLARE papel text;
BEGIN
  FOREACH papel IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = papel) THEN
      EXECUTE format('REVOKE ALL ON TABLE "controle_rate_limit" FROM %I', papel);
    END IF;
  END LOOP;
END $$;
