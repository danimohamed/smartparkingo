import OwnerSlotsClient from './_components/OwnerSlotsClient'

const Page = async ({ params }) => {
    const { id } = await params
    return <OwnerSlotsClient parkingId={id} />
}

export default Page
