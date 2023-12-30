import {MutableRefObject, useEffect, useRef, useState} from "react"

interface Props<T> {
    pendingListRefs: MutableRefObject<T[]>[];
    maxLength: number;
}

export default function useMergedList<T extends {time: number}>(props: Props<T>) {
    const {pendingListRefs, maxLength} = props

    const [list, setList] = useState<T[]>([])
    const lastSetTimestampRef = useRef<number>(0)

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.hidden) {
                return
            }

            if (new Date().getTime() - lastSetTimestampRef.current > 1000) {
                const pendingList: T[] = []

                pendingListRefs.forEach((pendingListRef) => {
                    Array.prototype.push.apply(pendingList, pendingListRef.current)
                    pendingListRef.current = []
                })

                pendingList.sort((a, b) => a.time - b.time)

                setList((prevList) => [...prevList, ...pendingList].slice(-1 * maxLength))
            } else {
                let targetPendingListRef: MutableRefObject<T[]> | null = null

                pendingListRefs.forEach((pendingListRef) => {
                    const pendingChat = pendingListRef.current[0]
                    if (pendingChat == null) return
                    if (targetPendingListRef == null || pendingChat.time < targetPendingListRef.current[0].time) {
                        targetPendingListRef = pendingListRef
                    }
                })

                if (targetPendingListRef != null) {
                    setList((prevList) => [...prevList, targetPendingListRef.current.shift()].slice(-1 * maxLength))
                }
            }

            lastSetTimestampRef.current = new Date().getTime()
        }, 75)

        return () => {
            clearInterval(interval)
            lastSetTimestampRef.current = 0
        }
    }, [pendingListRefs, maxLength])

    return {list, setList}
}