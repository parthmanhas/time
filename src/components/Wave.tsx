import { motion } from "framer-motion"

type WaveProps = {
    isRunning: boolean
    progress: number
    className?: string
}

export const Wave = ({ isRunning, progress, className }: WaveProps) => {
    const waveVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: isRunning ? 1 : 0 }
    }

    const fillVariants = {
        initial: { y: '100%' },
        animate: { y: `${100 - progress}%` }
    }

    const wave1Variants = {
        animate: {
            x: ["0%", "-100%"],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 5,
                    ease: "linear"
                }
            }
        }
    }

    const wave2Variants = {
        animate: {
            x: ["-100%", "0%"],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 7,
                    ease: "linear"
                }
            }
        }
    }

    return (
        <motion.div
            className={className}
            variants={waveVariants}
            initial="hidden"
            animate="visible"
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
            }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                variants={fillVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1, ease: "linear" }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
            >
                <motion.div
                    variants={wave1Variants}
                    animate="animate"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '-20px',
                        height: '20px',
                        opacity: 0.7,
                    }}
                >
                    <svg
                        style={{ width: '200%', height: '100%' }}
                        viewBox="0 0 200 10"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 10 V5 Q30 0, 50 5 T100 5 T150 5 T200 5 V10 z"
                            fill="rgba(255, 255, 255, 0.1)"
                        />
                    </svg>
                </motion.div>
                <motion.div
                    variants={wave2Variants}
                    animate="animate"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '-15px',
                        height: '20px',
                        opacity: 0.5,
                    }}
                >
                    <svg
                        style={{ width: '200%', height: '100%' }}
                        viewBox="0 0 200 10"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 10 V5 Q30 0, 50 5 T100 5 T150 5 T200 5 V10 z"
                            fill="rgba(255, 255, 255, 0.1)"
                        />
                    </svg>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}