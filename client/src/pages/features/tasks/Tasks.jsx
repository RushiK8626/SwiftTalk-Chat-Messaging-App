import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import BottomTabBar from "../../../components/common/BottomTabBar";
import PageHeader from "../../../components/common/PageHeader";
import SearchBar from "../../../components/common/SearchBar";
import NewBtn from "../../../components/common/NewBtn";
import AddTaskModal from "../../../components/modals/AddTaskModal";
import TaskItem from "../../../components/features/TaskItem";
import TaskDetail from "../../../components/features/TaskDetail";
import { useToast } from "../../../hooks/useToast";
import useResponsive from "../../../hooks/useResponsive";
import {
    getSidebarWidth,
    setSidebarWidth,
    SIDEBAR_CONFIG
} from "../../../utils/storage";
import { fetchUserTasks, deleteTask, updateTaskStatus } from "../../../utils/api";
import "./Tasks.css";

const Tasks = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const userId =
        location.state?.userId ||
        JSON.parse(localStorage.getItem("user") || "{}").user_id;
    const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
        return getSidebarWidth();
    });
    const containerRef = useRef(null);
    const isResizingRef = useRef(false);
    const headerRef = useRef(null);
    const bottomTabBarRef = useRef(null);
    const [tasksMenuHeight, setTasksMenuHeight] = useState(
        "calc(100vh - 200px)"
    );
    const isWideScreen = useResponsive();

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);

    useEffect(() => {
        const calculateHeight = () => {
            const headerHeight = headerRef.current?.offsetHeight || 0;
            const bottomTabHeight = bottomTabBarRef.current?.offsetHeight || 0;
            const totalOffset = headerHeight + bottomTabHeight + 20; // 20px for padding/margin
            setTasksMenuHeight(`calc(100vh - ${totalOffset}px)`);
        };

        calculateHeight();
        window.addEventListener("resize", calculateHeight);
        return () => window.removeEventListener("resize", calculateHeight);
    }, [selectedTask]);

    useEffect(() => {
        const handleMouseDown = (e) => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const rightEdge = rect.left + leftPanelWidth;

            if (Math.abs(e.clientX - rightEdge) < 5) {
                isResizingRef.current = true;
            }
        };

        const handleMouseMove = (e) => {
            if (!isResizingRef.current || !containerRef.current) return;

            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            let newWidth = e.clientX - rect.left;

            newWidth = Math.max(
                SIDEBAR_CONFIG.MIN_WIDTH,
                Math.min(newWidth, SIDEBAR_CONFIG.MAX_WIDTH)
            );
            setLeftPanelWidth(newWidth);
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
        };

        if (typeof window !== "undefined" && window.innerWidth >= 900) {
            document.addEventListener("mousedown", handleMouseDown);
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousedown", handleMouseDown);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [leftPanelWidth]);

    const handleBackFromDetail = () => {
        window.history.back();
    };

    const handleTaskSelect = (task) => {
        setSelectedTask(task);
        if (!isWideScreen) {
            window.history.pushState({ taskDetailOpen: true }, "");
        }
    };

    const handleAddNewTask = (task) => {
        if (!task) return;

        setTasks((prevTasks) => {
            const updatedTasks = [...prevTasks, task];
            return sortTasks(updatedTasks);
        });
    };

    const handleUpdateTaskStatus = async (task) => {
        if (!task) return;
        try {
            const taskId = task.task_id ?? task.id ?? task._id;
            if (!taskId) return;

            const currentStatus = task.status ?? task.completed ?? "pending";
            const newStatus = currentStatus === "completed" ? "pending" : "completed";

            await updateTaskStatus(taskId, newStatus);

            setTasks((prev) =>
                prev.map((t) => {
                    const id = t.task_id ?? t.id ?? t._id;
                    return id === taskId ? { ...t, status: newStatus } : t;
                })
            );

            setSelectedTask((prev) => {
                if (!prev) return prev;
                const id = prev.task_id ?? prev.id ?? prev._id;
                return id === taskId ? { ...prev, status: newStatus } : prev;
            });
        } catch (err) {
            console.error("Error marking task as completed:", err);
            showToast("Failed to mark task as completed", "error");
        }
    }

    const handleTaskDelete = async (task) => {
        if (!task) return;
        try {
            const taskId = task.task_id ?? task.id ?? task._id;
            if (!taskId) return;

            await deleteTask(taskId);

            const updatedTasks = tasks.filter(task => task.task_id !== taskId);
            setTasks(updatedTasks);

            setSelectedTask((prev) => {
                if (!prev) return prev;
                const id = prev.task_id ?? prev.id ?? prev._id;
                return id === taskId ? null : prev;
            });
        } catch (err) {
            console.error("Error deleting the task: ", err);
            showToast("Failed to delete the task", "error");
        }
    }

    const handleTaskEdit = (updatedTask) => {
        if (!updatedTask) return;

        setTasks(prev => {
            const updated = prev.map(task =>
                task.task_id === updatedTask.task_id ? updatedTask : task
            );
            return sortTasks(updated);
        });

        setSelectedTask(prev => {
            if (!prev) return prev;
            const id = prev.task_id ?? prev.id ?? prev._id;
            const updatedId = updatedTask.task_id ?? updatedTask.id ?? updatedTask._id;
            return id === updatedId ? updatedTask : prev;
        });
    }

    const handleSubtaskToggle = (taskId, subtaskId, newIsCompleted) => {
        if (!taskId || !subtaskId) return;

        const updateSubtasks = (task) => {
            if (!task) return task;
            const id = task.task_id ?? task.id ?? task._id;
            if (id !== taskId) return task;

            return {
                ...task,
                subtasks: (task.subtasks || []).map(subtask => {
                    const subId = subtask.subtask_id ?? subtask.id ?? subtask._id;
                    if (subId !== subtaskId) return subtask;

                    return {
                        ...subtask,
                        is_completed: typeof newIsCompleted === 'boolean'
                            ? newIsCompleted
                            : !subtask.is_completed,
                    };
                })
            };
        };

        setTasks(prev => prev.map(updateSubtasks));
        setSelectedTask(prev => updateSubtasks(prev));
    };

    useEffect(() => {
        const handlePopState = (event) => {
            if (selectedTask && !isWideScreen) {
                setSelectedTask(null);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [selectedTask, isWideScreen]);

    const sortTasks = (tasks) => {
        return [...tasks].sort((a, b) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return timeB - timeA;
        });
    }

    const filteredTasks = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return tasks;
        return tasks.filter((t) =>
            (t.title || "").toLowerCase().includes(q) ||
            (t.description || "").toLowerCase().includes(q)
        );
    }, [tasks, searchQuery]);

    useEffect(() => {
        const fetchTasks = async (retry = false) => {
            if (!userId) {
                setError("User ID not found.");
                setLoading(false);
                return;
            }
            try {
                const data = await fetchUserTasks(userId);
                const sortedTasks = sortTasks(data.tasks || []);
                setTasks(sortedTasks);
            } catch (err) {
                console.error("Error fetching tasks:", err);
                if (err.message && err.message.includes("Failed to fetch")) {
                    setError("Unable to connect to server. Please check your connection.");
                } else {
                    setError(err.message || "Error loading tasks. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [userId]);

    return (
        (selectedTask && !isWideScreen) ? (
            <TaskDetail
                task={selectedTask}
                onToggleSubtask={handleSubtaskToggle}
                onEdit={handleTaskEdit}
                onBack={handleBackFromDetail}
                showBackButton={true}
            />
        ) : (
            <div className="tasks-page" data-embedded={isEmbedded}>
                <div
                    className="tasks-container"
                    ref={containerRef}
                    style={
                        !isEmbedded && isWideScreen
                            ? {
                                display: "grid",
                                gridTemplateColumns: `${leftPanelWidth}px 1fr`,
                            } : {}
                    }
                >
                    {/* Left Panel - Tasks Menu */}
                    <div className="tasks-left-panel">
                        <div className="tasks-header" ref={headerRef}>
                            <PageHeader
                                title="Tasks"
                                backgroundColor="var(--background-color)"
                                onBack={() => navigate(-1)}
                            />
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search tasks..."
                            />
                        </div>

                        <div className="tasks-menu-wrapper">
                            <SimpleBar style={{ maxHeight: tasksMenuHeight }}>
                                <div className="tasks-list">
                                    {loading ? (
                                        <div className="no-tasks">
                                            <p>Loading…</p>
                                        </div>
                                    ) : error ? (
                                        <div className="no-tasks">
                                            <p>{error}</p>
                                        </div>
                                    ) : filteredTasks.length > 0 ? (
                                        filteredTasks.map((task) => {
                                            const taskId = task.task_id || task.id || task._id;
                                            const selectedId = selectedTask?.task_id || selectedTask?.id || selectedTask?._id;
                                            const isTaskSelected = selectedTask && taskId && selectedId === taskId;
                                            return (
                                                <TaskItem
                                                    key={taskId}
                                                    task={task}
                                                    isSelected={isTaskSelected}
                                                    isCompleted={task.status === "completed"}
                                                    onClick={() => handleTaskSelect(task)}
                                                    onDelete={() => handleTaskDelete(task)}
                                                    onToggleComplete={() => handleUpdateTaskStatus(task)}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div className="no-tasks">
                                            <p>No tasks found</p>
                                        </div>
                                    )}
                                </div>
                            </SimpleBar>
                        </div>

                        <NewBtn onClick={() => { setShowNewTaskModal(true) }} />

                        <div ref={bottomTabBarRef}>
                            <BottomTabBar activeTab="tasks" />
                        </div>
                    </div>

                    {/* Right Panel - Task Content */}
                    {isWideScreen && <div className="tasks-right-panel">
                        {selectedTask ? (
                            <TaskDetail
                                task={selectedTask}
                                onToggleSubtask={handleSubtaskToggle}
                                onEdit={handleTaskEdit}
                            />
                        ) : (
                            <div className="tasks-placeholder">
                                <p>Select a task from the list</p>
                            </div>
                        )}
                    </div>}
                </div>

                <AddTaskModal
                    isOpen={showNewTaskModal}
                    onClose={() => { setShowNewTaskModal(false) }}
                    onAddTask={(task) => { handleAddNewTask(task) }}
                />
            </div>
        )
    );
};

export default Tasks;
