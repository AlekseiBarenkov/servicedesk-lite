import { App as AntApp } from 'antd'

type ConfirmDiscard = (onConfirm: () => void) => void

export const useConfirmDiscard = (): ConfirmDiscard => {
  const { modal } = AntApp.useApp()

  return (onConfirm: () => void): void => {
    modal.confirm({
      title: 'Закрыть без сохранения?',
      content: 'Введённые данные будут потеряны.',
      okText: 'Закрыть',
      cancelText: 'Вернуться',
      okButtonProps: { danger: true },
      onOk: onConfirm,
    })
  }
}
