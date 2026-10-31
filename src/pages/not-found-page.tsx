import { Button, Result } from 'antd'
import { Link } from 'react-router'

const NotFoundPage = () => (
  <Result
    status="404"
    title="Страница не найдена"
    subTitle="Такого адреса в приложении нет."
    extra={
      <Link to="/requests">
        <Button type="primary">К заявкам</Button>
      </Link>
    }
  />
)

export default NotFoundPage
