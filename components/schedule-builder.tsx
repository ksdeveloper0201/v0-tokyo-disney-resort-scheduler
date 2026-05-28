"use client";

import { ScheduleItem, ItemType, ScheduleSlot } from "@/lib/types";
import {
    useScheduleStore,
    isFixedTimeItem,
    parseTime,
    formatTime,
    calculateEndTime,
} from "@/lib/store";
import {
    getItemsByPark,
    getUniqueAreas,
    getItemsByType,
} from "@/lib/mock-data";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    useDroppable,
    useDraggable,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Sparkles,
    Music,
    Flag,
    Calendar,
    Utensils,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    GripVertical,
    X,
    ChevronLeft,
    Lock,
    Unlock,
    Maximize2,
    Minimize2,
} from "lucide-react";

interface ScheduleBuilderProps {
    onBack: () => void;
    onSave: () => void;
}

const typeIcons: Record<ItemType, React.ReactNode> = {
    attraction: <Sparkles className="w-4 h-4" />,
    show: <Music className="w-4 h-4" />,
    parade: <Flag className="w-4 h-4" />,
    event: <Calendar className="w-4 h-4" />,
    restaurant: <Utensils className="w-4 h-4" />,
};

const typeLabels: Record<ItemType, string> = {
    attraction: "アトラクション",
    show: "ショー",
    parade: "パレード",
    event: "イベント",
    restaurant: "レストラン",
};

const typeColors: Record<
    ItemType,
    { bg: string; border: string; text: string; badge: string; solid: string }
> = {
    attraction: {
        bg: "bg-primary/15",
        border: "border-primary/40",
        text: "text-primary",
        badge: "bg-primary text-primary-foreground",
        solid: "bg-primary",
    },
    show: {
        bg: "bg-chart-2/15",
        border: "border-chart-2/40",
        text: "text-chart-2",
        badge: "bg-chart-2 text-white",
        solid: "bg-chart-2",
    },
    parade: {
        bg: "bg-chart-3/15",
        border: "border-chart-3/40",
        text: "text-chart-3",
        badge: "bg-chart-3 text-white",
        solid: "bg-chart-3",
    },
    event: {
        bg: "bg-chart-4/15",
        border: "border-chart-4/40",
        text: "text-chart-4",
        badge: "bg-chart-4 text-white",
        solid: "bg-chart-4",
    },
    restaurant: {
        bg: "bg-accent/15",
        border: "border-accent/40",
        text: "text-accent",
        badge: "bg-accent text-white",
        solid: "bg-accent",
    },
};

// Draggable Category Tab for priority reordering
function SortableCategoryTab({
    type,
    rank,
    isActive,
    count,
    onClick,
}: {
    type: ItemType;
    rank: number;
    isActive: boolean;
    count: number;
    onClick: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: type });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const colors = typeColors[type];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-1 pl-2 pr-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                    ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                    : "bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-transparent"
            } ${isDragging ? "opacity-70 shadow-lg" : ""}`}
        >
            <button
                {...attributes}
                {...listeners}
                className="p-1 cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="w-3 h-3 text-muted-foreground" />
            </button>
            <button onClick={onClick} className="flex items-center gap-2">
                <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                            ? colors.badge
                            : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                >
                    {rank + 1}
                </span>
                {typeIcons[type]}
                <span className="hidden sm:inline">{typeLabels[type]}</span>
                {count > 0 && (
                    <span
                        className={`px-1.5 py-0.5 rounded-full text-xs ${colors.badge}`}
                    >
                        {count}
                    </span>
                )}
            </button>
        </div>
    );
}

// Draggable item card for adding to timeline
function DraggableItemCard({
    item,
    isSelected,
    isScheduled,
    onTap,
}: {
    item: ScheduleItem;
    isSelected: boolean;
    isScheduled: boolean;
    onTap: () => void;
}) {
    const isFixed = isFixedTimeItem(item);
    const hasMultipleTimes = item.fixedTimes && item.fixedTimes.length > 1;

    // Only allow dragging for free time items
    const canDrag = !isFixed;

    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `item-${item.id}`,
            data: { item, type: "new-item" },
            disabled: !canDrag,
        });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              zIndex: isDragging ? 100 : undefined,
          }
        : undefined;

    const colors = typeColors[item.type];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 hover:bg-muted/30 transition-colors border-b border-border last:border-b-0 ${
                isSelected ? colors.bg : ""
            } ${isDragging ? "opacity-70 shadow-lg rounded-lg" : ""}`}
        >
            <button
                onClick={onTap}
                className="flex-1 text-left flex items-center gap-3"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`${colors.text}`}>
                            {typeIcons[item.type]}
                        </span>
                        <span className="font-medium text-card-foreground text-sm">
                            {item.name}
                        </span>
                        {item.diningType && (
                            <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    item.diningType === "restaurant"
                                        ? "bg-accent/20 text-accent"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {item.diningType === "restaurant"
                                    ? "レストラン"
                                    : "ファスト"}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{item.duration}分</span>
                        {item.fixedTimes && item.fixedTimes.length > 0 && (
                            <span className="bg-muted px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                {item.fixedTimes.length === 1
                                    ? item.fixedTimes[0]
                                    : `${item.fixedTimes.length}公演`}
                            </span>
                        )}
                        {!isFixed && (
                            <span className="bg-muted px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                <Unlock className="w-2.5 h-2.5" />
                                自由時間
                            </span>
                        )}
                        {isScheduled && (
                            <span
                                className={`px-1.5 py-0.5 rounded text-xs ${colors.badge}`}
                            >
                                配置済
                            </span>
                        )}
                    </div>
                </div>
                <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                            ? `${colors.badge} border-transparent`
                            : "border-border"
                    }`}
                >
                    {isSelected && <Check className="w-4 h-4" />}
                </div>
            </button>

            {canDrag && (
                <button
                    {...attributes}
                    {...listeners}
                    className="ml-2 p-2 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
                >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}

// Draggable timeline slot card
function DraggableTimelineSlot({
    slot,
    onRemoveSlot,
    isExpanded,
    canDrag,
}: {
    slot: ScheduleSlot;
    onRemoveSlot: (id: string) => void;
    isExpanded: boolean;
    canDrag: boolean;
}) {
    const isLockedSlot = Boolean(slot.isLocked ?? isFixedTimeItem(slot.item));
    const canDragSlot = canDrag && !isLockedSlot;

    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `timeline-slot-${slot.id}`,
            data: { slot, type: "timeline-slot-drag" },
            disabled: !canDragSlot,
        });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              zIndex: isDragging ? 100 : undefined,
          }
        : undefined;

    const colors = typeColors[slot.item.type];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-2 rounded-lg ${colors.bg} ${colors.border} border-l-4 transition-all ${
                isDragging ? "opacity-70 shadow-lg" : ""
            } ${canDragSlot ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        {canDragSlot && (
                            <button
                                {...attributes}
                                {...listeners}
                                className="p-0.5 cursor-grab active:cursor-grabbing touch-none"
                            >
                                <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            </button>
                        )}
                        <span className={`${colors.text}`}>
                            {typeIcons[slot.item.type]}
                        </span>
                        <span
                            className={`font-medium text-xs truncate ${isExpanded ? "" : "max-w-[140px]"}`}
                        >
                            {slot.item.name}
                        </span>
                        {slot.isLocked && (
                            <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {slot.startTime} - {slot.endTime}
                    </div>
                </div>
                <button
                    onClick={() => onRemoveSlot(slot.id)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// Timeline hour slot (droppable)
function TimelineHourSlot({
    hour,
    slots,
    onRemoveSlot,
    isExpanded,
}: {
    hour: number;
    slots: ScheduleSlot[];
    onRemoveSlot: (id: string) => void;
    isExpanded: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `timeline-hour-${hour}`,
        data: { hour, type: "timeline-hour-slot" },
    });

    const timeStr = formatTime(hour * 60);
    const slotsInHour = slots.filter((slot) => {
        const slotStart = parseTime(slot.startTime);
        return slotStart >= hour * 60 && slotStart < (hour + 1) * 60;
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex border-b border-border min-h-[60px] transition-colors ${
                isOver ? "bg-primary/10" : ""
            }`}
        >
            {/* Time label */}
            <div className="w-16 flex-shrink-0 py-2 px-2 text-xs font-medium text-muted-foreground border-r border-border bg-muted/30">
                {timeStr}
            </div>

            {/* Slots */}
            <div className="flex-1 py-1 px-2 space-y-1">
                {slotsInHour.map((slot) => {
                    const isLockedSlot = Boolean(
                        slot.isLocked ?? isFixedTimeItem(slot.item),
                    );
                    return (
                        <DraggableTimelineSlot
                            key={slot.id}
                            slot={slot}
                            onRemoveSlot={onRemoveSlot}
                            isExpanded={isExpanded}
                            canDrag={!isLockedSlot}
                        />
                    );
                })}
                {slotsInHour.length === 0 && isOver && (
                    <div className="h-full flex items-center justify-center text-xs text-primary">
                        ここにドロップ
                    </div>
                )}
            </div>
        </div>
    );
}

function MobileHorizontalOverview({
    slots,
    onRemoveSlot,
}: {
    slots: ScheduleSlot[];
    onRemoveSlot: (id: string) => void;
}) {
    const sortedSlots = useMemo(
        () =>
            [...slots].sort(
                (a, b) => parseTime(a.startTime) - parseTime(b.startTime),
            ),
        [slots],
    );

    const hours = useMemo(() => {
        const h = [];
        for (let i = 8; i < 23; i++) h.push(i);
        return h;
    }, []);

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden bg-card">
            <div className="min-w-max h-full flex">
                {hours.map((hour) => {
                    const hourSlots = sortedSlots.filter((slot) => {
                        const slotStart = parseTime(slot.startTime);
                        return slotStart >= hour * 60 && slotStart < (hour + 1) * 60;
                    });

                    return (
                        <div
                            key={hour}
                            className="w-20 flex-shrink-0 border-r border-border px-1.5 py-1 flex flex-col"
                        >
                            <div className="text-[10px] font-medium text-muted-foreground text-center">
                                {formatTime(hour * 60)}
                            </div>
                            <div className="flex-1 mt-1 space-y-1 overflow-y-auto">
                                {hourSlots.map((slot) => {
                                    const colors = typeColors[slot.item.type];
                                    return (
                                        <div
                                            key={slot.id}
                                            className={`rounded-md border ${colors.border} p-1.5 ${colors.bg}`}
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <div className="min-w-0">
                                                    <div className={`text-[9px] font-medium truncate ${colors.text}`}>
                                                        {slot.item.name}
                                                    </div>
                                                    <div className="text-[8px] text-muted-foreground mt-0.5">
                                                        {slot.startTime} - {slot.endTime}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveSlot(slot.id)}
                                                    className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex-shrink-0"
                                                    title="削除"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {hourSlots.length === 0 && (
                                    <div className="h-full min-h-10 rounded-md border border-dashed border-border text-[8px] text-muted-foreground flex items-center justify-center text-center px-1">
                                        空き
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Mini timeline sidebar
function MiniTimeline({
    slots,
    onExpand,
    onRemoveSlot,
}: {
    slots: ScheduleSlot[];
    onExpand: () => void;
    onRemoveSlot: (id: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: "mini-timeline",
        data: { type: "mini-timeline" },
    });

    const sortedSlots = useMemo(
        () =>
            [...slots].sort(
                (a, b) => parseTime(a.startTime) - parseTime(b.startTime),
            ),
        [slots],
    );

    const hours = useMemo(() => {
        const h = [];
        for (let i = 8; i < 23; i++) h.push(i);
        return h;
    }, []);

    return (
        <div
            ref={setNodeRef}
            className={`h-full flex flex-col bg-card border-l border-border transition-colors ${
                isOver ? "ring-2 ring-primary ring-inset" : ""
            }`}
        >
            {/* Header */}
            <div className="p-2 border-b border-border bg-muted/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                    タイムライン
                </span>
                <button
                    onClick={onExpand}
                    className="p-1 rounded hover:bg-muted"
                    title="拡大表示"
                >
                    <Maximize2 className="w-3 h-3 text-muted-foreground" />
                </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto">
                {hours.map((hour) => (
                    <TimelineHourSlot
                        key={hour}
                        hour={hour}
                        slots={sortedSlots}
                        onRemoveSlot={onRemoveSlot}
                        isExpanded={false}
                    />
                ))}
            </div>

            {/* Count */}
            <div className="p-2 border-t border-border bg-muted/30 text-center">
                <span className="text-xs text-muted-foreground">
                    {slots.length}件
                </span>
            </div>
        </div>
    );
}

// Full timeline modal
function FullTimelineModal({
    slots,
    onClose,
    onRemoveSlot,
}: {
    slots: ScheduleSlot[];
    onClose: () => void;
    onRemoveSlot: (id: string) => void;
}) {
    const sortedSlots = useMemo(
        () =>
            [...slots].sort(
                (a, b) => parseTime(a.startTime) - parseTime(b.startTime),
            ),
        [slots],
    );

    const hours = useMemo(() => {
        const h = [];
        for (let i = 8; i < 23; i++) h.push(i);
        return h;
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                        1日のタイムスケジュール
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted flex items-center gap-2"
                    >
                        <Minimize2 className="w-4 h-4" />
                        <span className="text-sm">閉じる</span>
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    {hours.map((hour) => (
                        <TimelineHourSlot
                            key={hour}
                            hour={hour}
                            slots={sortedSlots}
                            onRemoveSlot={onRemoveSlot}
                            isExpanded={true}
                        />
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        合計 {slots.length} 件のスケジュール
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                    >
                        戻る
                    </button>
                </div>
            </div>
        </div>
    );
}

// Drag overlay for visual feedback
function DragOverlayContent({ item }: { item: ScheduleItem }) {
    const colors = typeColors[item.type];
    return (
        <div
            className={`p-3 rounded-lg ${colors.bg} ${colors.border} border-2 shadow-xl min-w-[200px]`}
        >
            <div className="flex items-center gap-2">
                <span className={colors.text}>{typeIcons[item.type]}</span>
                <span className="font-medium text-sm">{item.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
                {item.duration}分
            </div>
        </div>
    );
}

export function ScheduleBuilder({ onBack, onSave }: ScheduleBuilderProps) {
    const {
        parkType,
        categoryOrder,
        setCategoryOrder,
        activeCategory,
        setActiveCategory,
        selectedItems,
        toggleSelectedItem,
        scheduleSlots,
        addScheduleSlot,
        removeScheduleSlot,
        updateScheduleSlot,
        setStep,
    } = useScheduleStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(
        new Set(),
    );
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [timeModalItem, setTimeModalItem] = useState<ScheduleItem | null>(
        null,
    );
    const [timeModalHour, setTimeModalHour] = useState<number | null>(null);
    const [showFullTimeline, setShowFullTimeline] = useState(false);
    const [draggedItem, setDraggedItem] = useState<ScheduleItem | null>(null);
    const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [mobileTimelineExpanded, setMobileTimelineExpanded] = useState(false);

    useEffect(() => {
        const updateViewport = () => {
            setIsMobileViewport(window.innerWidth < 768);
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);
        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
    );

    // Get all items for current park
    const allItems = useMemo(() => {
        return parkType ? getItemsByPark(parkType) : [];
    }, [parkType]);

    // Filter items by current category and search
    const filteredItems = useMemo(() => {
        let items = getItemsByType(allItems, activeCategory);
        if (searchQuery) {
            items = items.filter(
                (item) =>
                    item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    item.area.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        }
        return items;
    }, [allItems, activeCategory, searchQuery]);

    const areas = useMemo(() => getUniqueAreas(filteredItems), [filteredItems]);

    const toggleArea = (area: string) => {
        setCollapsedAreas((prev) => {
            const next = new Set(prev);
            if (next.has(area)) {
                next.delete(area);
            } else {
                next.add(area);
            }
            return next;
        });
    };

    const isSelected = (item: ScheduleItem) =>
        selectedItems.some((i) => i.id === item.id);
    const isScheduled = (item: ScheduleItem) =>
        scheduleSlots.some((slot) => slot.item.id === item.id);

    // Count selected items per category
    const categorySelectionCounts = useMemo(() => {
        const counts: Record<ItemType, number> = {
            attraction: 0,
            show: 0,
            parade: 0,
            event: 0,
            restaurant: 0,
        };
        selectedItems.forEach((item) => {
            counts[item.type]++;
        });
        return counts;
    }, [selectedItems]);

    // Time slots for the time picker
    const timeSlots = useMemo(() => {
        const slots: string[] = [];
        for (let hour = 8; hour < 22; hour++) {
            for (let min = 0; min < 60; min += 30) {
                slots.push(formatTime(hour * 60 + min));
            }
        }
        return slots;
    }, []);

    // Handle item tap - show time modal
    const handleItemTap = useCallback(
        (item: ScheduleItem) => {
            if (isSelected(item)) {
                toggleSelectedItem(item);
                return;
            }

            // For items with single fixed time, just add directly
            if (item.fixedTimes && item.fixedTimes.length === 1) {
                toggleSelectedItem(item);
                return;
            }

            // For items with multiple fixed times or free time items, show time modal
            setTimeModalItem(item);
            setTimeModalHour(null);
            setShowTimeModal(true);
        },
        [toggleSelectedItem, isSelected],
    );

    // Handle time selection from modal
    const handleTimeSelect = useCallback(
        (time: string) => {
            if (!timeModalItem) return;

            const endTime = calculateEndTime(time, timeModalItem.duration);
            const isFixed = isFixedTimeItem(timeModalItem);

            const newSlot: ScheduleSlot = {
                id: `slot-${timeModalItem.id}-${Date.now()}`,
                item: { ...timeModalItem, selectedTime: time },
                startTime: time,
                endTime,
                hasConflict: false,
                conflictWith: [],
                isLocked: isFixed,
            };

            if (!selectedItems.some((i) => i.id === timeModalItem.id)) {
                toggleSelectedItem(timeModalItem);
            }

            addScheduleSlot(newSlot);

            setShowTimeModal(false);
            setTimeModalItem(null);
            setTimeModalHour(null);
        },
        [timeModalItem, selectedItems, toggleSelectedItem, addScheduleSlot],
    );

    // Handle drag events
    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const { active } = event;
            if (active.data.current?.type === "new-item") {
                setDraggedItem(active.data.current.item);
                if (isMobileViewport) {
                    setMobileTimelineExpanded(true);
                }
            } else if (active.data.current?.type === "timeline-slot-drag") {
                setDraggedSlot(active.data.current.slot);
                if (isMobileViewport) {
                    setMobileTimelineExpanded(true);
                }
            }
        },
        [isMobileViewport],
    );

    const handleDragCancel = useCallback(() => {
        setDraggedItem(null);
        setDraggedSlot(null);
        if (isMobileViewport) {
            setMobileTimelineExpanded(false);
        }
    }, [isMobileViewport]);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setDraggedItem(null);
            setDraggedSlot(null);
            if (isMobileViewport) {
                setMobileTimelineExpanded(false);
            }

            if (!over) return;

            // Category reordering
            if (
                categoryOrder.includes(active.id as ItemType) &&
                categoryOrder.includes(over.id as ItemType)
            ) {
                const oldIndex = categoryOrder.indexOf(active.id as ItemType);
                const newIndex = categoryOrder.indexOf(over.id as ItemType);
                if (oldIndex !== newIndex) {
                    setCategoryOrder(
                        arrayMove(categoryOrder, oldIndex, newIndex),
                    );
                }
                return;
            }

            // Timeline slot time change (drag existing slot to new hour)
            if (
                active.data.current?.type === "timeline-slot-drag" &&
                over.data.current?.type === "timeline-hour-slot"
            ) {
                const slot = active.data.current.slot as ScheduleSlot;
                const isLockedSlot = Boolean(
                    slot.isLocked ?? isFixedTimeItem(slot.item),
                );

                if (isLockedSlot) {
                    return;
                }

                const newHour = over.data.current.hour as number;

                // Calculate new time based on the hour
                const newStartTime = formatTime(newHour * 60);
                const newEndTime = calculateEndTime(
                    newStartTime,
                    slot.item.duration,
                );

                updateScheduleSlot(slot.id, {
                    startTime: newStartTime,
                    endTime: newEndTime,
                });
                return;
            }

            // New item dropped on timeline hour slot
            if (
                active.data.current?.type === "new-item" &&
                over.data.current?.type === "timeline-hour-slot"
            ) {
                const item = active.data.current.item as ScheduleItem;
                const hour = over.data.current.hour as number;

                // For free time items, add directly at the hour
                if (!isFixedTimeItem(item)) {
                    const time = formatTime(hour * 60);
                    const endTime = calculateEndTime(time, item.duration);

                    const newSlot: ScheduleSlot = {
                        id: `slot-${item.id}-${Date.now()}`,
                        item: { ...item, selectedTime: time },
                        startTime: time,
                        endTime,
                        hasConflict: false,
                        conflictWith: [],
                        isLocked: false,
                    };

                    if (!selectedItems.some((i) => i.id === item.id)) {
                        toggleSelectedItem(item);
                    }

                    addScheduleSlot(newSlot);
                }
                return;
            }

            // Item dropped on mini timeline or full timeline
            if (
                active.data.current?.type === "new-item" &&
                (over.id === "mini-timeline" ||
                    over.id === "full-timeline-container")
            ) {
                const item = active.data.current.item as ScheduleItem;

                if (!isFixedTimeItem(item)) {
                    // Show time picker for free time items
                    setTimeModalItem(item);
                    setTimeModalHour(null);
                    setShowTimeModal(true);
                }
            }
        },
        [
            categoryOrder,
            setCategoryOrder,
            selectedItems,
            toggleSelectedItem,
            addScheduleSlot,
            updateScheduleSlot,
        ],
    );

    const parkName =
        parkType === "land" ? "ディズニーランド" : "ディズニーシー";

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="min-h-screen flex flex-col bg-background">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setStep(2);
                                    onBack();
                                }}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                戻る
                            </button>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">
                                    {parkName}
                                </p>
                                <h1 className="text-base font-bold text-foreground">
                                    スケジュール作成
                                </h1>
                            </div>
                            <button
                                onClick={onSave}
                                disabled={scheduleSlots.length === 0}
                                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                保存
                            </button>
                        </div>
                    </div>

                    {/* Category Tabs with drag & drop reordering */}
                    <div className="px-4 pb-3">
                        <p className="text-xs text-muted-foreground mb-2">
                            カテゴリをドラッグして優先順位を変更できます
                        </p>
                        <SortableContext
                            items={categoryOrder}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {categoryOrder.map((type, index) => (
                                    <SortableCategoryTab
                                        key={type}
                                        type={type}
                                        rank={index}
                                        isActive={activeCategory === type}
                                        count={categorySelectionCounts[type]}
                                        onClick={() => setActiveCategory(type)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </div>
                </div>

                {/* Main content with sidebar */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Item selection */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Search */}
                        <div className="p-4 border-b border-border">
                            <input
                                type="text"
                                placeholder={`${typeLabels[activeCategory]}を検索...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto pb-4">
                            <div className="px-4">
                                {areas.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        該当するアイテムがありません
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {areas.map((area) => {
                                            const areaItems =
                                                filteredItems.filter(
                                                    (item) =>
                                                        item.area === area,
                                                );
                                            const isExpanded =
                                                !collapsedAreas.has(area);

                                            return (
                                                <div
                                                    key={area}
                                                    className="bg-card rounded-xl border border-border overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            toggleArea(area)
                                                        }
                                                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-card-foreground text-sm">
                                                                {area}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                (
                                                                {
                                                                    areaItems.length
                                                                }
                                                                )
                                                            </span>
                                                        </div>
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="border-t border-border">
                                                            {areaItems.map(
                                                                (item) => (
                                                                    <DraggableItemCard
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        item={
                                                                            item
                                                                        }
                                                                        isSelected={isSelected(
                                                                            item,
                                                                        )}
                                                                        isScheduled={isScheduled(
                                                                            item,
                                                                        )}
                                                                        onTap={() =>
                                                                            handleItemTap(
                                                                                item,
                                                                            )
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Mini Timeline sidebar (1/5 width) */}
                    <div className="w-1/5 min-w-[120px] max-w-[180px] hidden md:block">
                        <MiniTimeline
                            slots={scheduleSlots}
                            onExpand={() => setShowFullTimeline(true)}
                            onRemoveSlot={removeScheduleSlot}
                        />
                    </div>
                </div>

                {/* Mobile: Compact schedule panel (1/4 height by default, full screen while dragging) */}
                <div
                    className={`md:hidden fixed left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-all duration-300 ease-in-out ${
                        mobileTimelineExpanded
                            ? "inset-0"
                            : "bottom-0 h-[35vh] max-h-[35vh]"
                    }`}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                スケジュール
                            </p>
                            <p className="text-sm text-foreground">
                                {scheduleSlots.length}件
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFullTimeline(true)}
                                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium text-xs hover:bg-primary/90 transition-colors flex items-center gap-1"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                全画面
                            </button>
                            {mobileTimelineExpanded && (
                                <button
                                    onClick={() =>
                                        setMobileTimelineExpanded(false)
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                                >
                                    閉じる
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="h-[calc(100%-3.25rem)] overflow-hidden">
                        {!mobileTimelineExpanded ? (
                            <MobileHorizontalOverview
                                slots={scheduleSlots}
                                onRemoveSlot={removeScheduleSlot}
                            />
                        ) : (
                            <MiniTimeline
                                slots={scheduleSlots}
                                onExpand={() => setMobileTimelineExpanded(true)}
                                onRemoveSlot={removeScheduleSlot}
                            />
                        )}
                    </div>
                </div>

                {/* Full Timeline Modal */}
                {showFullTimeline && (
                    <FullTimelineModal
                        slots={scheduleSlots}
                        onClose={() => setShowFullTimeline(false)}
                        onRemoveSlot={removeScheduleSlot}
                    />
                )}

                {/* Time Selection Modal */}
                {showTimeModal && timeModalItem && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md sm:mx-4 max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                typeColors[timeModalItem.type]
                                                    .text
                                            }
                                        >
                                            {typeIcons[timeModalItem.type]}
                                        </span>
                                        <div>
                                            <h3 className="font-bold text-card-foreground">
                                                {timeModalItem.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                所要時間:{" "}
                                                {timeModalItem.duration}分
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowTimeModal(false);
                                            setTimeModalItem(null);
                                            setTimeModalHour(null);
                                        }}
                                        className="p-2 rounded-lg hover:bg-muted"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 overflow-y-auto max-h-96">
                                {timeModalItem.fixedTimes &&
                                timeModalItem.fixedTimes.length > 1 ? (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            公演時間を選択してください
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {timeModalItem.fixedTimes.map(
                                                (time) => {
                                                    const endTime =
                                                        calculateEndTime(
                                                            time,
                                                            timeModalItem.duration,
                                                        );
                                                    return (
                                                        <button
                                                            key={time}
                                                            onClick={() =>
                                                                handleTimeSelect(
                                                                    time,
                                                                )
                                                            }
                                                            className={`p-4 rounded-xl border-2 ${typeColors[timeModalItem.type].border} hover:${typeColors[timeModalItem.type].bg} text-center transition-all`}
                                                        >
                                                            <span className="font-bold text-lg">
                                                                {time}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground block">
                                                                - {endTime}
                                                            </span>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            開始時間を選択してください
                                        </p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {timeSlots.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() =>
                                                        handleTimeSelect(time)
                                                    }
                                                    className="p-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-center text-sm transition-colors"
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Drag Overlay */}
                <DragOverlay>
                    {draggedItem && <DragOverlayContent item={draggedItem} />}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
