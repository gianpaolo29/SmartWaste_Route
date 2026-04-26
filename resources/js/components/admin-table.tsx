import { ReactNode } from 'react';

type Col<T> = {
    header: string;
    cell: (row: T) => ReactNode;
    className?: string;
};

export function AdminTable<T extends { id: number | string }>({
    columns,
    rows,
    empty = 'No records.',
}: {
    columns: Col<T>[];
    rows: T[];
    empty?: string;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-50 text-left dark:border-white/5">
                        {columns.map((c, i) => (
                            <th
                                key={i}
                                className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${c.className ?? ''}`}
                            >
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-5 py-12 text-center text-gray-400"
                            >
                                <div className="text-sm">{empty}</div>
                            </td>
                        </tr>
                    )}
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className="border-t border-gray-50 transition-colors hover:bg-gray-50/50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]"
                        >
                            {columns.map((c, i) => (
                                <td key={i} className={`px-5 py-3.5 ${c.className ?? ''}`}>
                                    {c.cell(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
