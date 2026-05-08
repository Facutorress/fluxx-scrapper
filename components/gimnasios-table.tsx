'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, MessageSquarePlus, SearchX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/status-chip';
import { GimnasioSheet } from '@/components/gimnasio-sheet';
import { ConversacionDialog } from '@/components/conversacion-dialog';
import { STATUS_ACTIVOS, STATUS_HISTORICO } from '@/lib/database.types';
import type { Gimnasio, Estrategia } from '@/lib/database.types';

type Tab = 'activos' | 'historico';
const ALL = '__all__';

export function GimnasiosTable({
  gimnasios,
  estrategiasActivas,
}: {
  gimnasios: Gimnasio[];
  estrategiasActivas: Pick<Estrategia, 'id' | 'nombre'>[];
}) {
  const [tab, setTab] = useState<Tab>('activos');
  const [search, setSearch] = useState('');
  const [ciudad, setCiudad] = useState<string>(ALL);
  const [tipo, setTipo] = useState<string>(ALL);

  const [openSheet, setOpenSheet] = useState(false);
  const [sheetGimnasio, setSheetGimnasio] = useState<Gimnasio | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogGimnasio, setDialogGimnasio] = useState<Gimnasio | null>(null);

  const ciudades = useMemo(
    () =>
      Array.from(new Set(gimnasios.map((g) => g.ciudad).filter(Boolean) as string[])).sort(),
    [gimnasios],
  );
  const tipos = useMemo(
    () => Array.from(new Set(gimnasios.map((g) => g.tipo).filter(Boolean) as string[])).sort(),
    [gimnasios],
  );

  const filtered = useMemo(() => {
    const statusSet = tab === 'activos' ? STATUS_ACTIVOS : STATUS_HISTORICO;
    const q = search.trim().toLowerCase();

    return gimnasios.filter((g) => {
      if (!statusSet.includes(g.status_prospeccion)) return false;
      if (q && !(g.nombre ?? '').toLowerCase().includes(q)) return false;
      if (ciudad !== ALL && g.ciudad !== ciudad) return false;
      if (tipo !== ALL && g.tipo !== tipo) return false;
      return true;
    });
  }, [gimnasios, tab, search, ciudad, tipo]);

  function openGimnasio(g: Gimnasio) {
    setSheetGimnasio(g);
    setOpenSheet(true);
  }

  function openCargarConversacion(g: Gimnasio, e: React.MouseEvent) {
    e.stopPropagation();
    setDialogGimnasio(g);
    setOpenDialog(true);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="border border-border bg-surface p-0">
              <TabsTrigger
                value="activos"
                className="border-r border-border px-4 py-2 text-xs uppercase tracking-wider data-[state=active]:bg-overlay data-[state=active]:text-text"
              >
                Activos
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="px-4 py-2 text-xs uppercase tracking-wider data-[state=active]:bg-overlay data-[state=active]:text-text"
              >
                Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim"
              />
              <Input
                placeholder="Buscar por nombre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 md:w-64 border-border bg-surface text-text placeholder:text-text-dim"
              />
            </div>

            <Select value={ciudad} onValueChange={setCiudad}>
              <SelectTrigger className="w-full md:w-44 border-border bg-surface text-text">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent className="border-border bg-overlay">
                <SelectItem value={ALL}>Todas las ciudades</SelectItem>
                {ciudades.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-full md:w-44 border-border bg-surface text-text">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="border-border bg-overlay">
                <SelectItem value={ALL}>Todos los tipos</SelectItem>
                {tipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="panel-card"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                  Nombre
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                  Tipo
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                  Ciudad
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                  Rating
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                  Reviews
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-text-muted">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <SearchX
                        strokeWidth={1.25}
                        className="h-12 w-12 text-text-dim"
                      />
                      <p className="font-medium text-text-muted">
                        Sin gimnasios para mostrar.
                      </p>
                      <p className="max-w-sm text-xs font-light text-text-dim">
                        {search || ciudad !== ALL || tipo !== ALL
                          ? 'Probá ajustar los filtros o buscar con otros términos.'
                          : tab === 'activos'
                            ? 'Cuando el scraper cargue gimnasios, aparecen acá.'
                            : 'Todavía no movieron gimnasios al histórico.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((g) => (
                  <TableRow
                    key={g.place_id}
                    onClick={() => openGimnasio(g)}
                    className="group/row cursor-pointer border-b border-l-[2px] border-l-transparent border-border transition-colors duration-150 hover:border-l-violet hover:bg-overlay"
                  >
                    <TableCell className="font-sans font-medium text-text transition-colors duration-150 group-hover/row:text-cyan/90">
                      {g.nombre ?? <em className="text-text-dim">sin nombre</em>}
                    </TableCell>
                    <TableCell>
                      {g.tipo ? (
                        <Badge
                          variant="outline"
                          className="border-border-strong text-text-muted"
                        >
                          {g.tipo}
                        </Badge>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-text-muted">{g.ciudad ?? '—'}</TableCell>
                    <TableCell>
                      {g.rating != null ? (
                        <span className="flex items-center gap-1 font-mono-data text-text">
                          <Star strokeWidth={1.5} className="h-3.5 w-3.5 text-cyan" />
                          {g.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono-data text-text-muted">
                      {g.cantidad_reviews ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusChip placeId={g.place_id} status={g.status_prospeccion} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={(e) => openCargarConversacion(g, e)}
                        className="h-8 gap-1.5 bg-transparent px-3 text-xs text-text-muted hover:bg-bg hover:text-text"
                      >
                        <MessageSquarePlus strokeWidth={1.5} className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Cargar conversación</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>

        <p className="font-mono text-xs text-text-dim">
          {filtered.length} de {gimnasios.length} gimnasios
        </p>
      </div>

      <GimnasioSheet
        key={sheetGimnasio?.place_id ?? 'none'}
        gimnasio={sheetGimnasio}
        open={openSheet}
        onOpenChange={setOpenSheet}
      />

      <ConversacionDialog
        key={dialogGimnasio?.place_id ?? 'none-dialog'}
        gimnasio={dialogGimnasio}
        estrategias={estrategiasActivas}
        open={openDialog}
        onOpenChange={setOpenDialog}
      />
    </>
  );
}
