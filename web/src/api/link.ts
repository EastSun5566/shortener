import { getRequest } from './request'
import type { CreateLinkData, LinkResponse } from '../types'

export async function createLink (data: CreateLinkData) {
  return await getRequest().post<LinkResponse>('/links', data)
}

export async function getLink () {
  return await getRequest().get<LinkResponse[]>('/links')
}
