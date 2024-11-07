import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [employeeSelected, setEmployeeSelected] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    const employeesPromise = employeeUtils.fetchAll()
    const transactionsPromise = paginatedTransactionsUtils.fetchAll()

    await Promise.all([employeesPromise, transactionsPromise])

    setEmployeeSelected(false)
    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsLoading(true)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
      setIsLoading(false)
      setEmployeeSelected(true)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const showViewMoreButton = useMemo(() => {
    return (
      transactions !== null &&
      !employeeSelected &&
      paginatedTransactions !== null &&
      paginatedTransactions.nextPage !== null
    )
  }, [transactions, employeeSelected, paginatedTransactions])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employees, employeeUtils.loading, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeeUtils.loading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item?.id ?? "",
            label: item ? `${item.firstName} ${item.lastName}` : "",
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === "") {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {showViewMoreButton && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={loadAllTransactions}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}